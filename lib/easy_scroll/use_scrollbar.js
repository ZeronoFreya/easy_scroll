// 摇杆
import { ref, reactive } from 'vue'
import { clamp } from './utils.js'

export default function useScrollbar(runtimeData, startLoop, joyStickMode) {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.2,
    })

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

    const itemY = ref(0)
    
    // trackHeight * scrollRatio.y = thumbTop
    const scrollRatio = reactive({
        x: 0, // scrollLeft / scrollWidth
        y: 0, // scrollTop / scrollHeight
    })
    // trackHeight * sizeRatio.y = thumbHeight
    const sizeRatio = reactive({
        x: 0, // viewWidth / contentWidth
        y: 0, // viewHeight / contentHeight
    })

    let math_temp = 0
    let thumb_mouse_offset = 0

    let itemStartY = 0

    let activeTrack = null
    let activeThumb = null



    const maxDistance = {
        x: 0,
        y: 0,
    }

    const init = () => {
        scrollRef.x.track = scrollRef.x.box?.querySelector('[track]') ?? null
        scrollRef.y.track = scrollRef.y.box?.querySelector('[track]') ?? null

        scrollRef.x.thumb = scrollRef.x.box?.querySelector('[thumb]') ?? null
        scrollRef.y.thumb = scrollRef.y.box?.querySelector('[thumb]') ?? null
    }

    

    const track_up = (e) => {
        runtimeData.isDragging = false
        // const track = e.currentTarget
        if (joyStickMode) {
            itemY.value = 0
            activeThumb.style.transform = `translate(-50%, 0px)`            
        } else {
            // track.classList.remove('es_track_down')
            math_temp = 0
            thumb_mouse_offset = 0
        }

        activeTrack.releasePointerCapture(e.pointerId)
        activeTrack.removeEventListener('pointermove', track_move)
        activeTrack.removeEventListener('pointerup', track_up)

        activeThumb = null
        activeTrack = null

        
        setTimeout(() => {
            active.value = false
        }, 300);

        // thumb = null
        // resetTime(scroll)
    }

    const track_move = (e) => {
        // console.log(666);
        if (!runtimeData.isDragging) return
        // const track = e.currentTarget

        if (joyStickMode) {
            let deltaY = e.clientY - itemStartY
            const maxDistance = (activeTrack.offsetHeight - activeThumb.offsetHeight) * 0.5
            itemY.value = clamp(deltaY, -maxDistance, maxDistance)
        } else {
            let deltaY = e.clientY - itemStartY
            const maxDistance = activeTrack.offsetHeight - activeThumb.offsetHeight
            itemY.value = clamp(deltaY, 0, maxDistance)

            
            // let targetScrollY = itemY.value * 2500 / track.offsetHeight
            // // 更新速度 (为了松手后的惯性)
            // // runtimeData.velocity = targetScrollY - runtimeData.scroll.y;
            // runtimeData.scroll.y = -targetScrollY
        }

        activeThumb.style.transform = `translate(-50%, ${itemY.value}px)`
    }

    const track_down = (e) => {
        if (runtimeData.isMiddleMouseActive || e.button != 0) return

        

        activeTrack = e.currentTarget
        const scroll = activeTrack.dataset.scroll
        activeThumb = scrollRef[scroll].thumb
        if (!activeThumb) return

        if (joyStickMode) {
            if (e.target !== activeThumb) {
                return
            }
            itemStartY = e.clientY
        } else {
            active.value = true
            // track.classList.add('es_track_down')
            const offsetSize = scroll == 'x' ? 'offsetWidth' : 'offsetHeight'
            // let offset = scroll == 'x' ? e.offsetX : e.offsetY
            // math_temp = refEl.scroll_content[offsetSize] / track[offsetSize]

            if (e.target === activeThumb) {
                // 拖拽 thumb: 使用点击的位置
                // thumb_mouse_offset = e.clientY - e.offsetY
                itemStartY = e.clientY - itemY.value
            } else {
                // 在 track 拖拽: 使用 thumb 的中心
                // thumb_mouse_offset = thumb[offsetSize] / 2
                // offset -= thumb_mouse_offset
                // refEl.scroll_box[scrollPos] = Math.round(offset * math_temp)
                // console.log(track.offsetTop)

                itemY.value = e.offsetY - activeThumb[offsetSize] * 0.5
                activeThumb.style.transform = `translate(-50%, ${itemY.value}px)`
                itemStartY = e.clientY - itemY.value
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
    }

    return {
        active,
        scrollRef,
        joyMode,
        sensitivity,
        itemY,
        scrollRatio,
        sizeRatio,
        init,
        track_down,
        resize,
    }
}
