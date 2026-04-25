// 摇杆
import { ref, reactive, watch, onBeforeUnmount } from 'vue'
import { clamp, safeDivide } from './utils.js'

export default function useScrollbar(runtimeData, startLoop, signal, joyStickMode) {

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

    const maxScrBarPos = {
        x: 0,
        y: 0,
    }

    const maxScrRatio = reactive({
        x: 0, // maxScroll.x / maxScrBarPos.x
        y: 0, // maxScroll.y / maxScrBarPos.y
    })

    const thumbRect = reactive({
        x: {
            pos: 0,
            width: 0,
            height: 0,
        },
        y: {
            pos:0,
            width: 0,
            height: 0,
        },
    })



    
    const updateScrollPos = (scroll) => {
        if (joyStickMode || runtimeData.currCtrlType == 'scrollbar') return
        thumbRect[scroll].pos = maxScrBarPos[scroll] * runtimeData.progress[scroll]
    }

    const updateScrollBar = () => {
        if (scrollRef.x.thumb) {
            const w = scrollRef.x.track.offsetWidth
            thumbRect.x.width = Math.round(w * runtimeData.sizeRatio.x)
            maxScrBarPos.x = Math.ceil(w - thumbRect.x.width)
            maxScrRatio.x = safeDivide(runtimeData.maxScroll.x, maxScrBarPos.x)

            if (joyStickMode) {
                scrollRef.x.thumb.style.marginLeft = `-${Math.round(scrollRef.x.thumb.offsetWidth * 0.5)}px`
            }
        }
        if (scrollRef.y.thumb) {
            const h = scrollRef.y.track.offsetHeight
            thumbRect.y.height = Math.round(h * runtimeData.sizeRatio.y)
            maxScrBarPos.y = Math.ceil(h - thumbRect.y.height)
            maxScrRatio.y = safeDivide(runtimeData.maxScroll.y, maxScrBarPos.y)

            if (joyStickMode) {
                scrollRef.y.thumb.style.marginTop = `-${Math.round(scrollRef.y.thumb.offsetHeight * 0.5)}px`
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
        runtimeData.currCtrlType = ''
        if (joyStickMode) {
            thumbRect.y.pos = 0
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
        if (runtimeData.currCtrlType != 'scrollbar') return

        if (joyStickMode) {
            const maxPos = maxScrBarPos.y * 0.5
            thumbRect.y.pos = clamp(e.clientY - itemStartY, -maxPos, maxPos)
        } else {
            thumbRect.y.pos = clamp(e.clientY - itemStartY, 0, maxScrBarPos.y)
        }
    }

    const track_down = (e, scroll) => {
        e.preventDefault()
        e.stopPropagation()
        if (runtimeData.currCtrlType == 'midnav' || e.button != 0) return

        activeTrack = e.currentTarget
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
                itemStartY = e.clientY - thumbRect.y.pos
            } else {
                // 在 track 拖拽: 使用 thumb 的中心
                thumbRect.y.pos = e.offsetY - activeThumb[offsetSize] * 0.5
                itemStartY = e.clientY - thumbRect.y.pos
            }
        }

        runtimeData.currCtrlType = 'scrollbar'
        startLoop() // 唤醒

        activeTrack.addEventListener('pointerup', track_up, { signal })
        activeTrack.addEventListener('pointermove', track_move, { signal })
        activeTrack.setPointerCapture(e.pointerId)
    }

    const resize = () => {
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
        maxScrRatio,
        maxScrBarPos,
        init,
        track_down,
        resize,
        updateScrollPos,
    }
}
