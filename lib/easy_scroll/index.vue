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

        // 滚动条 auto-hide 共享状态：容器(滚动区域)与滚动条自身【分开跟踪】hover，
        // 任一 hover → 显示；两处都离开才(延迟)渐隐。
        // 分开跟踪的原因：若共用单个布尔，鼠标从滚动条滑到容器内容区/缝隙、
        // 或经过 offsetScroll 造成的条与容器间空隙时，单方 mouseleave 会把整体
        // 状态误清掉 → 滚动条“显示后闪没”。
        // 显隐只用 opacity + CSS 过渡(见 scrollbar.vue)，不卸载滚动条 DOM。
        const containerHover = ref(false)
        // 滚动条自身 hover 逐轴跟踪(x/y 互不干扰): 两轴并存时离开其中一条,
        // 不会误关仍在 hover 的另一条的可见性。
        const barHover = reactive({ x: false, y: false })
        let containerTimer = null
        const barTimer = { x: null, y: null }
        const clearHoverTimer = (timer) => {
            if (timer) clearTimeout(timer)
            return null
        }
        // 各自 leave 延迟落定：为“鼠标从容器移向被 teleport 到外部的滚动条”
        // 及穿过窄缝隙留缓冲，避免中间帧双方同空导致闪烁。
        const setContainerHover = (v) => {
            containerTimer = clearHoverTimer(containerTimer)
            if (v) containerHover.value = true
            else containerTimer = setTimeout(() => (containerHover.value = false), 200)
        }
        const setBarHover = (axis, v) => {
            barTimer[axis] = clearHoverTimer(barTimer[axis])
            if (v) barHover[axis] = true
            else barTimer[axis] = setTimeout(() => (barHover[axis] = false), 200)
        }
        // 空闲标记：滚动/拖动/鼠标移动停止 3s → 滚动条加上 es_idle 类；
        // 再次滚动或鼠标移动时立即摘除并重新计时。仅负责切换 class。
        const scrollIdle = ref(false)
        let idleTimer = null
        const resetIdle = () => {
            if (scrollIdle.value) scrollIdle.value = false
            if (idleTimer) clearTimeout(idleTimer)
            idleTimer = setTimeout(() => {
                idleTimer = null
                scrollIdle.value = true
            }, 2000)
        }
        const scrollUi = { containerHover, barHover, setContainerHover, setBarHover, scrollIdle, resetIdle }
        provide('scrollUi', scrollUi)

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
            resetIdle()
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
                resetIdle()
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
                resetIdle()
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

            boxRef.value.style.setProperty('--es-bar-w', `${props.scrollWidth}px`);
        })

        onBeforeUnmount(() => {
            clearTimeout(wheelSettleTimer)
            clearTimeout(containerTimer)
            clearTimeout(barTimer.x)
            clearTimeout(barTimer.y)
            clearTimeout(idleTimer)
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
            scrollUi,
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
