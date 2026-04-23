// 摇杆
import { ref, reactive, watch, onBeforeUnmount } from 'vue'
import { clamp } from './utils.js'

export default function useScrollbar(runtimeData, startLoop, signal, joyStickMode) {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.2,
    })

    // let math_temp = 0
    // let thumb_mouse_offset = 0

    let itemStartY = 0

    let activeTrack = null
    let activeThumb = null

    const active = ref(false)

    const joyMode = joyStickMode

    const scrollRef = reactive({
        x: {
            box: null,
            track: null,
            thumb: null,
        },
        y: {
            box: null,
            track: null,
            thumb: null,
        },
    })

    // 灵敏度
    const sensitivity = ref(0.1)

    // trackHeight * scrollRatio.y = thumbTop
    const scrollRatio = reactive({
        x: 0, // scrollLeft / contentWidth
        y: 0, // scrollTop / contentHeight
    })
    // trackHeight * sizeRatio.y = thumbHeight
    const sizeRatio = reactive({
        x: 0, // viewWidth / contentWidth
        y: 0, // viewHeight / contentHeight
    })

    // maxScrollPos + viewportSize == contentSize
    const maxScrollPos = {
        x: 0,
        y: 0,
    }
    const maxScrBarPos = {
        x: 0,
        y: 0,
    }

    const thumbRect = reactive({
        x: {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        },
        y: {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        },
    })

    watch(
        () => runtimeData.scroll,
        (scroll) => {
            scrollRatio.x = scroll.x / runtimeData.contentSize.w
            scrollRatio.y = scroll.y / runtimeData.contentSize.h
            if (!joyStickMode && !runtimeData.isDragging) {
                // let deltaY = (maxScrBarPos.y * Math.abs(scroll.y)) / maxScrollPos.y
                // thumbRect.y.top = clamp(scroll.y <= 0 ? deltaY : -deltaY, 0, maxScrBarPos.y)

                thumbRect.y.top = scrollRef.y.track.offsetHeight * -scrollRatio.y
            }
        },
        { deep: true },
    )

    const updateScrollBar = () => {
        if (scrollRef.x.thumb) {
            maxScrBarPos.x = scrollRef.x.track.offsetWidth - scrollRef.x.thumb.offsetWidth
        }
        if (scrollRef.y.thumb) {
            const h = scrollRef.y.track.offsetHeight
            thumbRect.y.height = h * sizeRatio.y
            maxScrBarPos.y = h - thumbRect.y.height

            if (joyStickMode) {
                scrollRef.y.thumb.style.marginTop = `-${scrollRef.y.thumb.offsetHeight * 0.5}px`
            }
        }
    }

    const init = () => {
        const trackX = scrollRef.x.box?.querySelector('[track]') ?? null
        const trackY = scrollRef.y.box?.querySelector('[track]') ?? null
        scrollRef.x.track = trackX
        scrollRef.y.track = trackY

        const thumbX = scrollRef.x.box?.querySelector('[thumb]') ?? null
        const thumbY = scrollRef.y.box?.querySelector('[thumb]') ?? null
        scrollRef.x.thumb = thumbX
        scrollRef.y.thumb = thumbY

        if (trackY) {
            // trackY.addEventListener(
            //     'pointerdown',
            //     (e) => {
            //         track_down(e, 'y')
            //     },
            //     { signal },
            // )
            if (joyStickMode && getComputedStyle(trackY).position === 'static') {
                trackY.style.position = 'relative'
            }
        }

        if (joyStickMode) {
            if (trackY && getComputedStyle(trackY).position === 'static') {
                trackY.style.position = 'relative'
            }
            if (thumbY) {
                if (getComputedStyle(thumbY).position === 'static') {
                    thumbY.style.position = 'absolute'
                }
                thumbY.style.top = '50%'
            }
        }

        updateScrollBar()
    }

    const track_up = (e) => {
        runtimeData.isDragging = false
        // const track = e.currentTarget
        if (joyStickMode) {
            thumbRect.y.top = 0
            // activeThumb.style.transform = `translate(-50%, 0px)`
        } else {
            // track.classList.remove('es_track_down')
            // math_temp = 0
            // thumb_mouse_offset = 0
        }

        activeTrack.releasePointerCapture(e.pointerId)
        activeTrack.removeEventListener('pointermove', track_move)
        activeTrack.removeEventListener('pointerup', track_up)

        activeThumb = null
        activeTrack = null

        setTimeout(() => {
            active.value = false
        }, 300)
    }

    const track_move = (e) => {
        if (!runtimeData.isDragging) return

        if (joyStickMode) {
            const maxPos = maxScrBarPos.y * 0.5
            thumbRect.y.top = clamp(e.clientY - itemStartY, -maxPos, maxPos)
        } else {
            thumbRect.y.top = clamp(e.clientY - itemStartY, 0, maxScrBarPos.y)
        }
    }

    const track_down = (e, scroll) => {
        e.preventDefault()
        e.stopPropagation()
        if (runtimeData.isMiddleMouseActive || e.button != 0) return

        activeTrack = e.currentTarget
        // const scroll = activeTrack.dataset.scroll
        activeThumb = scrollRef[scroll].thumb
        if (!activeThumb) return

        if (joyStickMode) {
            if (e.target !== activeThumb) {
                return
            }
            itemStartY = e.clientY
        } else {
            active.value = true
            const offsetSize = scroll == 'x' ? 'offsetWidth' : 'offsetHeight'

            if (e.target === activeThumb) {
                // 拖拽 thumb: 使用点击的位置
                itemStartY = e.clientY - thumbRect.y.top
            } else {
                // 在 track 拖拽: 使用 thumb 的中心
                thumbRect.y.top = e.offsetY - activeThumb[offsetSize] * 0.5
                itemStartY = e.clientY - thumbRect.y.top
            }
        }

        runtimeData.isDragging = true
        runtimeData.inputSource = 'stick'
        startLoop() // 唤醒

        activeTrack.addEventListener('pointerup', track_up)
        activeTrack.addEventListener('pointermove', track_move)
        activeTrack.setPointerCapture(e.pointerId)
    }

    const resize = () => {
        scrollRatio.x = runtimeData.scroll.x / runtimeData.contentSize.w
        scrollRatio.y = runtimeData.scroll.y / runtimeData.contentSize.h

        sizeRatio.x = runtimeData.viewportSize.w / runtimeData.contentSize.w
        sizeRatio.y = runtimeData.viewportSize.h / runtimeData.contentSize.h

        maxScrollPos.x = runtimeData.contentSize.w - runtimeData.viewportSize.w
        maxScrollPos.y = runtimeData.contentSize.h - runtimeData.viewportSize.h

        updateScrollBar()
    }

    // onBeforeUnmount(() => {
    //     controller.abort()
    // })

    return {
        active,
        scrollRef,
        joyMode,
        sensitivity,
        thumbRect,
        scrollRatio,
        sizeRatio,
        init,
        track_down,
        resize,
    }
}
