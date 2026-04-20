<script>
import { defineComponent, ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import sProps from './props.js'

import Cursor from './cursor.vue'
// import ScrollBar from './scrollbar.vue'

import useWheel from './use_wheel.js'
import useScrollbar from './use_scrollbar.js'
import useMidNav from './use_midnav.js'

import useLoop from './use_loop.js'

export default defineComponent({
    components: {Cursor},
    inheritAttrs: false,
    props: sProps,
    setup(props) {
        const boxRef = ref(null)
        const ulRef = ref(null)

        const runtimeData = reactive({
            rafId: null,
            isDragging: false,
            isMiddleMouseActive: false,
            inputSource: 'inertia',
            maxScroll: 0,
            scroll: {
                x: 0,
                y: 0,
            },
            velocity: 0,
            isWheelFreezing: false,
            isOverscrolling: false,
        })

        const startLoop = () => {
            if (!runtimeData.rafId) {
                runtimeData.rafId = requestAnimationFrame(physicsLoop)
            }
        }
        const stopLoop = () => {
            if (runtimeData.rafId) {
                cancelAnimationFrame(runtimeData.rafId);
                runtimeData.rafId = null;
            }
        };

        const scrollCtrl = reactive({
            wheel: useWheel(runtimeData, startLoop, props.overTip),
            scroll: useScrollbar(runtimeData, startLoop, props.scrollJoy),
            midnav: props.midMouseNav ? useMidNav(runtimeData, boxRef, startLoop) : null,
        })

        const physicsLoop = useLoop(runtimeData, scrollCtrl)    
        

        const displayScrollY = computed(() => runtimeData.scroll.y.toFixed(2))

        const updateMaxScroll = ()=>{
            if (ulRef.value && boxRef.value) {
                runtimeData.maxScroll = Math.min(
                    0,
                    boxRef.value.offsetHeight - ulRef.value.offsetHeight,
                )     
                if(scrollCtrl.scroll){
                    scrollCtrl.scroll.resize(boxRef.value.offsetWidth, boxRef.value.offsetHeight)
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
            boxRef.value.addEventListener('wheel', scrollCtrl.wheel.onWheel, { passive: true })

            if(scrollCtrl.midnav){
                scrollCtrl.midnav.init()
            }
            if(scrollCtrl.scroll){
                scrollCtrl.scroll.init()
            }
            
            updateMaxScroll()
            observer.observe(boxRef.value, options)
            observer.observe(ulRef.value, options)

        })

        onBeforeUnmount(() => {
            stopLoop();
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
