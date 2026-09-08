<script>
import {
    defineComponent,
    useSlots,
    ref,
    reactive,
    provide,
    computed,
    watch,
    onMounted,
    onBeforeUnmount,
} from 'vue'
import sProps from './props.js'
import { clamp, readWheel, safeDivide } from './utils.js'
import useOverscroll from './use_overscroll.js'
import release from './release.js'

import Cursor from './cursor.vue'
import Hint from './hint.vue'
import ScrollBar from './scrollbar.vue'

import useWheel from './use_wheel.js'
import useScrollbar from './use_scrollbar.js'
import useMidNav from './use_midnav.js'
import useHint from './use_hint.js'
import useAutoResetBool from './use_auto_reset_bool.js'

export default defineComponent({
    components: { Cursor, Hint, ScrollBar },
    inheritAttrs: false,
    props: sProps,
    setup(props) {
        const boxRef = ref(null)
        const ulRef = ref(null)

        const controller = new AbortController()
        const { signal } = controller

        const runtimeData = reactive({
            // 输入扩展自管的 rAF 句柄(摇杆/中键拖动期间)
            rafId: null,
            draging: false,
            back: useAutoResetBool(300),
            currCtrlType: '',
            // 过界信息: before, after
            overscroll: {
                x: '',
                y: '',
            },
            maxOverscroll: {
                x: 0,
                y: 0,
            },
            // 过界倒计时(归位仲裁): run=归位被挂起, key=进度条重置信号
            countdown: {
                x: { key: 0, run: false },
                y: { key: 0, run: false },
            },
            scroll: {
                x: 0,
                y: 0,
            },
            maxScroll: {
                x: 0,
                y: 0,
            },
            viewportSize: {
                w: 0,
                h: 0,
            },
            contentSize: {
                w: 1,
                h: 1,
            },
            // viewportSize / contentSize
            sizeRatio: {
                x: 0,
                y: 0,
            },
            // 滚动进度: 当前滚动位置与最大滚动位置的比值
            progress: {
                x: 0,
                y: 0,
            },
        })        

        provide('runtimeData', runtimeData)

        // 主题解析: 'light'/'dark' 直接生效; 'auto' 跟随系统 prefers-color-scheme
        const mediaDark =
            typeof window !== 'undefined'
                ? (window.matchMedia?.('(prefers-color-scheme: dark)') ?? null)
                : null
        const systemDark = ref(mediaDark ? mediaDark.matches : false)
        const resolvedTheme = computed(() => {
            if (props.theme !== 'auto') return props.theme
            return systemDark.value ? 'dark' : 'light'
        })
        const onSystemThemeChange = (e) => {
            systemDark.value = e.matches
        }
        if (mediaDark) mediaDark.addEventListener('change', onSystemThemeChange)
        provide('theme', resolvedTheme)

        const slots = useSlots()
        // 工具函数：过滤插槽
        const filterSlots = (prefix) => {
            return Object.fromEntries(
                Object.entries(slots).filter(([name]) => name.startsWith(prefix)),
            )
        }

        const hint = props.showHint ? reactive(useHint(runtimeData)) : null
        provide('hint', hint)

        // 过界能力：标记判定与过界上限统一在此生产，与 hint UI 解耦
        const overscroll = useOverscroll(runtimeData)

        // 兄弟扩展互不引用；wheel 滚动后与 hint 的联动由装配层(组合根)桥接
        const scrollCtrl = reactive({
            wheel: useWheel(runtimeData, props.scrollAxis),
            scroll: props.scrollBar ? useScrollbar(runtimeData, signal, props.scrollJoy) : null,
            midnav: props.midMouseNav ? useMidNav(runtimeData, boxRef, props.scrollAxis) : null,
        })
        provide('scrollCtrl', scrollCtrl)

        const checkX = new Set(['x', 'a']);
        const checkY = new Set(['y', 'a']);

        // 组合根桥接: 滚轮事件 → 内核滚动; hint 启用时再通知其响应过界区滚轮方向
        const onWheel = (e) => {
            scrollCtrl.wheel.onWheel(e)
            // 各轴分量与 use_wheel 同源(readWheel: 上/左为正), 避免符号歧义
            const { x: horizontal, y: vertical } = readWheel(e)
            if (hint) {
                // 把本次滚轮的各轴分量路由到 hint(与 use_wheel 的轴路由平行)
                if (props.scrollAxis === 'x') {
                    const d = horizontal || vertical
                    if (d) hint.wheel(d, 'x')
                } else if (props.scrollAxis === 'y') {
                    if (vertical) hint.wheel(vertical, 'y')
                } else {
                    if (e.shiftKey) {
                        if (vertical) hint.wheel(vertical, 'x')
                    } else {
                        if (vertical) hint.wheel(vertical, 'y')
                        if (horizontal) hint.wheel(horizontal, 'x')
                    }
                }
            }
            // 滚轮停格后自动回弹（wheel 无"释放"事件）
            scheduleWheelSettle()
        }

        // wheel 是离散事件、没有"释放"语义：滚轮停格(delay 内无新事件)后
        // 若仍停留在过界区，则触发统一归位(back 快速回弹)。拖动/中键接管中不打扰，
        // 鼠标悬停在对应轴的面板上时让路（交给 mouseleave 归位）。
        let wheelSettleTimer = null
        const scheduleWheelSettle = (delay = 500) => {
            clearTimeout(wheelSettleTimer)
            wheelSettleTimer = setTimeout(() => {
                wheelSettleTimer = null
                if (runtimeData.draging || runtimeData.currCtrlType) return
                for (const axis of ['x', 'y']) {
                    if (hint && hint.mouseInHint[axis]) continue
                    const s = runtimeData.scroll[axis]
                    const max = runtimeData.maxScroll[axis]
                    if (s < 0 || s > max) {
                        release(runtimeData, axis)
                    }
                }
            }, delay)
        }

        const displayScrollX = computed(() => -runtimeData.scroll.x.toFixed(2))
        const displayScrollY = computed(() => -runtimeData.scroll.y.toFixed(2))

        const afterResize = () => {
            if (ulRef.value && boxRef.value) {

                let boxW = boxRef.value.offsetWidth
                let boxH = boxRef.value.offsetHeight
                if(props.autoSize){
                    if(checkX.has(props.autoSize) && boxW >= ulRef.value.offsetWidth){
                        boxW = ulRef.value.offsetWidth
                        boxRef.value.style.width = boxW + 'px'
                    }
                    if(checkY.has(props.autoSize) && boxH >= ulRef.value.offsetHeight){
                        boxH = ulRef.value.offsetHeight
                        boxRef.value.style.height = boxH + 'px'
                    }
                }

                runtimeData.viewportSize = {
                    w: boxW,
                    h: boxH,
                }
                runtimeData.contentSize = {
                    w: ulRef.value.offsetWidth,
                    h: ulRef.value.offsetHeight,
                }

                runtimeData.sizeRatio.x = safeDivide(
                    runtimeData.viewportSize.w,
                    runtimeData.contentSize.w,
                )
                runtimeData.sizeRatio.y = safeDivide(
                    runtimeData.viewportSize.h,
                    runtimeData.contentSize.h,
                )

                runtimeData.maxScroll.x = runtimeData.contentSize.w - runtimeData.viewportSize.w
                runtimeData.maxScroll.y = runtimeData.contentSize.h - runtimeData.viewportSize.h

                if (scrollCtrl.scroll) {
                    scrollCtrl.scroll.resize()
                }

                if (hint) {
                    hint.resize()
                }

                // 过界拉伸仅允许发生在该轴确实可滚动时(有内容溢出)
                overscroll.applyLimit({
                    x: hint && runtimeData.maxScroll.x > 0 ? hint.size.x.max : 0,
                    y: hint && runtimeData.maxScroll.y > 0 ? hint.size.y.max : 0,
                })

                // 内容/容器收缩可能使当前 scroll 越出新边界(如窗口变宽后无需再滚)：
                // 立即收敛回合法区, 避免无输入时永久停留在过界视觉状态。
                for (const axis of ['x', 'y']) {
                    const max = runtimeData.maxScroll[axis]
                    const s = runtimeData.scroll[axis]
                    if (s < 0 || s > max) {
                        runtimeData.back = true
                        runtimeData.scroll[axis] = clamp(s, 0, max)
                    }
                }
            }
        }

        watch(
            () => [runtimeData.scroll.x, runtimeData.maxScroll.x],
            ([left, max]) => {
                runtimeData.progress.x = safeDivide(left, max)

                // x 轴过界标记(与 y 同构)
                overscroll.update('x')

                if (scrollCtrl.scroll) {
                    scrollCtrl.scroll.updateScrollPos('x')
                }
                if (hint) {
                    hint.update('x')
                }
            },
        )
        watch(
            () => [runtimeData.scroll.y, runtimeData.maxScroll.y],
            ([top, max]) => {
                runtimeData.progress.y = safeDivide(top, max)

                // 过界标记判定收敛到 overscroll 模块
                overscroll.update('y')

                if (scrollCtrl.scroll) {
                    scrollCtrl.scroll.updateScrollPos('y')
                }
                if (hint) {
                    hint.update('y')
                }
            },
        )

        const options = {
            box: 'border-box', // 确保 CSS 计算尺寸时包括边框和内边距
        }
        const observer = new ResizeObserver(() => {
            afterResize()
        })

        onMounted(() => {
            boxRef.value.addEventListener('wheel', onWheel, {
                signal,
                passive: true,
            })

            if (scrollCtrl.midnav) {
                scrollCtrl.midnav.init()
            }
            if (scrollCtrl.scroll) {
                scrollCtrl.scroll.init()
            }

            afterResize()
            observer.observe(boxRef.value, options)
            observer.observe(ulRef.value, options)
        })

        onBeforeUnmount(() => {
            clearTimeout(wheelSettleTimer)
            if (mediaDark) mediaDark.removeEventListener('change', onSystemThemeChange)

            observer.unobserve(ulRef.value)
            observer.unobserve(boxRef.value)
            observer.disconnect()

            controller.abort()
        })
        return {
            runtimeData,
            scrollCtrl,
            hint,
            resolvedTheme,
            boxRef,
            ulRef,
            checkX,
            checkY,
            displayScrollX,
            displayScrollY,
            filterSlots,
        }
    },
})
</script>

<template lang="pug" src="./html.pug" />
<style lang="scss" src="./style.scss" />
