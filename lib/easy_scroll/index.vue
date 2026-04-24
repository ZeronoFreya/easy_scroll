<script>
import { defineComponent, ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import sProps from './props.js'

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
            // isDragging: false,
            inputSource: 'inertia',
            currCtrlType: '',
            scroll: {
                left: 0,
                top: 0,
            },
            maxScroll: {
                left: 0,
                top: 0,
            },

            velocity: 0,
            isWheelFreezing: false,
            isOverscrolling: false,
            viewportSize: {
                w: 0,
                h: 0,
            },
            contentSize: {
                w: 1,
                h: 1,
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

        const scrollCtrl = reactive({
            wheel: useWheel(runtimeData, startLoop, props.overTip),
            scroll: useScrollbar(runtimeData, startLoop, signal, props.scrollJoy),
            midnav: props.midMouseNav ? useMidNav(runtimeData, boxRef, startLoop) : null,
            hint: useHint(runtimeData, startLoop)
        })

        const physicsLoop = useLoop(runtimeData, scrollCtrl)

        const displayScrollY = computed(() => runtimeData.scroll.top.toFixed(2))

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

                runtimeData.maxScroll.left = runtimeData.contentSize.w - runtimeData.viewportSize.w
                runtimeData.maxScroll.top = runtimeData.contentSize.h - runtimeData.viewportSize.h
                // runtimeData.maxScroll.left = runtimeData.viewportSize.w - runtimeData.contentSize.w
                // runtimeData.maxScroll.top = runtimeData.viewportSize.h - runtimeData.contentSize.h

                if (scrollCtrl.scroll) {
                    scrollCtrl.scroll.resize()
                }
            }
        }

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
            boxRef,
            ulRef,
            displayScrollY,
        }
    },
})
</script>

<template lang="pug" src="./html.pug" />
<style lang="scss" src="./style.scss" />
