<script>
import { defineComponent, ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import sProps from './props.js'
import { clamp, safeDivide } from './utils.js'

import Cursor from './cursor.vue'
// import ScrollBar from './scrollbar.vue'

import useWheel from './use_wheel.js'
import useScrollbar from './use_scrollbar.js'
import useMidNav from './use_midnav.js'
import useHint from './use_hint.js'

import useLoop from './use_loop.js'

export default defineComponent({
    components: { Cursor },
    inheritAttrs: false,
    props: sProps,
    setup(props) {
        const boxRef = ref(null)
        const ulRef = ref(null)

        const controller = new AbortController()
        const { signal } = controller

        const runtimeData = reactive({
            rafId: null,
            // inputSource: 'inertia',
            currCtrlType: '',
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
            isOverscrolling: false,
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
                y: 0
            },
            // 滚动进度: 当前滚动位置与最大滚动位置的比值
            progress: {
                x: 0,
                y: 0
            },

        })





        const startLoop = () => {
            if (!runtimeData.rafId) {
                runtimeData.rafId = requestAnimationFrame(physicsLoop)
            }
        }
        const stopLoop = () => {
            if (runtimeData.rafId) {
                cancelAnimationFrame(runtimeData.rafId)
                runtimeData.rafId = null
            }
        }

        const hint = props.showHint ? reactive(useHint(runtimeData, startLoop)) : null
        
        const scrollCtrl = reactive({
            wheel: useWheel(runtimeData, startLoop, props.showHint),
            scroll: useScrollbar(runtimeData, startLoop, signal, props.scrollJoy, hint),
            midnav: props.midMouseNav ? useMidNav(runtimeData, boxRef, startLoop) : null,

        })

        


        const physicsLoop = useLoop(runtimeData, scrollCtrl, hint)

        const displayScrollY = computed(() => runtimeData.scroll.y.toFixed(2))

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

                runtimeData.sizeRatio.x = safeDivide(runtimeData.viewportSize.w, runtimeData.contentSize.w)
                runtimeData.sizeRatio.y = safeDivide(runtimeData.viewportSize.h, runtimeData.contentSize.h)

                runtimeData.maxScroll.x = runtimeData.contentSize.w - runtimeData.viewportSize.w
                runtimeData.maxScroll.y = runtimeData.contentSize.h - runtimeData.viewportSize.h


                if (scrollCtrl.scroll) {
                    scrollCtrl.scroll.resize()
                }
            }
        }

        watch(() => [runtimeData.scroll.x, runtimeData.maxScroll.x], ([left, max]) => {
            runtimeData.progress.x = safeDivide(Math.abs(left), max)
            if (scrollCtrl.scroll) {
                scrollCtrl.scroll.updateScrollPos('x')
            }
        })
        watch(() => [runtimeData.scroll.y, runtimeData.maxScroll.y], ([top, max]) => {
            runtimeData.progress.y = safeDivide(Math.abs(top), max)
            if (scrollCtrl.scroll) {
                scrollCtrl.scroll.updateScrollPos('y')
            }
        })

        const options = {
            box: 'border-box', // 确保 CSS 计算尺寸时包括边框和内边距
        }
        const observer = new ResizeObserver(() => {
            updateMaxScroll()
        })

        onMounted(() => {
            boxRef.value.addEventListener('wheel', scrollCtrl.wheel.onWheel, {
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
            stopLoop()
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
            displayScrollY,
        }
    },
})
</script>

<template lang="pug" src="./html.pug" />
<style lang="scss" src="./style.scss" />
