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
import { safeDivide } from './utils.js'
import useOverscroll from './use_overscroll.js'

import Cursor from './cursor.vue'
import Hint from './hint.vue'
import ScrollBar from './scrollbar.vue'

import useWheel from './use_wheel.js'
import useScrollbar from './use_scrollbar.js'
import useMidNav from './use_midnav.js'
import useHint from './use_hint.js'

// import useLoop from './use_loop.js'
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
            rafId: null,
            draging: false,
            back: useAutoResetBool(300),
            // inputSource: 'inertia',
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
            velocity: 0,
            // isWheelFreezing: false,
            // isOverscrolling: false,
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

        const slots = useSlots()
        // 工具函数：过滤插槽
        const filterSlots = (prefix) => {
            return Object.fromEntries(
                Object.entries(slots).filter(([name]) => name.startsWith(prefix)),
            )
        }

        // const startLoop = () => {
        //     if (!runtimeData.rafId) {
        //         runtimeData.rafId = requestAnimationFrame(physicsLoop)
        //     }
        // }
        // const stopLoop = () => {
        //     if (runtimeData.rafId) {
        //         cancelAnimationFrame(runtimeData.rafId)
        //         runtimeData.rafId = null
        //     }
        // }

        const hint = props.showHint ? reactive(useHint(runtimeData)) : null
        provide('hint', hint)

        // 过界能力：标记判定与过界上限统一在此生产，与 hint UI 解耦
        const overscroll = useOverscroll(runtimeData)

        // 兄弟扩展互不引用；wheel 滚动后与 hint 的联动由装配层(组合根)桥接
        const scrollCtrl = reactive({
            wheel: useWheel(runtimeData),
            scroll: props.scrollBar ? useScrollbar(runtimeData, signal, props.scrollJoy) : null,
            midnav: props.midMouseNav ? useMidNav(runtimeData, boxRef) : null,
        })
        provide('scrollCtrl', scrollCtrl)

        // 组合根桥接: 滚轮事件 → 内核滚动; hint 启用时再通知其响应过界区滚轮方向
        const onWheel = (e) => {
            scrollCtrl.wheel.onWheel(e)
            if (hint) {
                hint.wheel(e.wheelDeltaY)
            }
        }

        // const physicsLoop = useLoop(runtimeData, scrollCtrl, hint)

        const displayScrollX = computed(() => -runtimeData.scroll.x.toFixed(2))
        const displayScrollY = computed(() => -runtimeData.scroll.y.toFixed(2))

        const updateMaxScroll = () => {
            if (ulRef.value && boxRef.value) {
                runtimeData.viewportSize = {
                    w: boxRef.value.offsetWidth,
                    h: boxRef.value.offsetHeight,
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

                // 过界上限由启用方(当前为 hint)提供，交给过界能力统一持有
                overscroll.applyLimit({
                    x: hint ? hint.size.x.max : 0,
                    y: hint ? hint.size.y.max : 0,
                })
            }
        }

        watch(
            () => [runtimeData.scroll.x, runtimeData.maxScroll.x],
            ([left, max]) => {
                runtimeData.progress.x = safeDivide(left, max)
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
            updateMaxScroll()
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

            updateMaxScroll()
            observer.observe(boxRef.value, options)
            observer.observe(ulRef.value, options)
        })

        onBeforeUnmount(() => {
            // stopLoop()
            // if (freezeTimer) clearTimeout(freezeTimer)
            // window.removeEventListener('mousemove', onDrag)
            // window.removeEventListener('mouseup', endDrag)
            // window.removeEventListener('touchmove', onDrag)
            // window.removeEventListener('touchend', endDrag)
            // window.removeEventListener('mousedown', toggleMiddleMouse)
            // window.removeEventListener('mousemove', handleMouseMove)
            // window.removeEventListener('mousedown', handleMiddleMouseStop)

            observer.unobserve(ulRef.value)
            observer.unobserve(boxRef.value)
            observer.disconnect()

            controller.abort()
        })
        return {
            runtimeData,
            scrollCtrl,
            hint,
            boxRef,
            ulRef,
            displayScrollX,
            displayScrollY,
            filterSlots,
        }
    },
})
</script>

<template lang="pug" src="./html.pug" />
<style lang="scss" src="./style.scss" />
