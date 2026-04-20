// 摇杆
import { ref, reactive } from 'vue'
import { clamp } from './utils.js'

export default function useScrollbar(runtimeData, startLoop, joyStickMode) {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.2,
    })

    const config = {
        maxDistance: 70,
        friction: 0.95,
        stopThreshold: 0.05, // 速度小于此值停止
        positionSnapThreshold: 0.2, // 位置偏差小于此值吸附
    }

    // 灵敏度
    const sensitivity = ref(0.1)

    const itemY = ref(0)

    let math_temp = 0
    let thumb_mouse_offset = 0

    let itemStartY = 0

    let thumb = null

    const thumbRef = ref(null)

    const track_up = (e) => {
        runtimeData.isDragging = false
        const track = e.currentTarget
        if (joyStickMode) {
            itemY.value = 0
            if(thumb){
                thumb.style.transform = `translate(0, 0px)`
            }
        } else {
            // track.classList.remove('es_track_down')
            math_temp = 0
            thumb_mouse_offset = 0
        }

        track.releasePointerCapture(e.pointerId);
        track.removeEventListener('pointermove', track_move)
        track.removeEventListener('pointerup', track_up)
        
        thumb = null
        // resetTime(scroll)
    }

    const track_move = (e) => {
        // console.log(666);        
        if (!runtimeData.isDragging) return
        const track = e.currentTarget
        
        if (joyStickMode) {
            let deltaY = e.clientY - itemStartY
            // let clampedY = Math.max(-config.maxDistance, Math.min(config.maxDistance, deltaY))
            const maxDistance = (track.offsetHeight - thumb.offsetHeight) * 0.5
            itemY.value = clamp(deltaY, -maxDistance, maxDistance)
            
        } else {
            const scroll = track.dataset.scroll
            itemY.value = (scroll == 'x' ? e.offsetX : e.offsetY) - thumb_mouse_offset
            // scroll_to(scroll, Math.round(offset * math_temp))
        }
        if(thumb){
            // console.log(itemY.value);
            
            thumb.style.transform = `translate(0, ${itemY.value}px)`
        }
    }

    const track_down = (e) => {
        if (runtimeData.isMiddleMouseActive || e.button != 0) return
        runtimeData.isDragging = true
        runtimeData.inputSource = 'stick'
        startLoop() // 唤醒

        const track = e.currentTarget
        thumb = track.querySelector('[thumb]')

        if (joyStickMode) {
            itemStartY = e.clientY - itemY.value
        } else {
            const scroll = track.dataset.scroll
            // track.classList.add('es_track_down')
            const offsetSize = scroll == 'x' ? 'offsetWidth' : 'offsetHeight'
            let offset = scroll == 'x' ? e.offsetX : e.offsetY
            // math_temp = refEl.scroll_content[offsetSize] / track[offsetSize]
            
            if(thumb){
                if (e.target === thumb) {
                    // 拖拽 thumb: 使用点击的位置
                    thumb_mouse_offset = offset
                } else {
                    // 在 track 拖拽: 使用 thumb 的中心
                    thumb_mouse_offset = thumb[offsetSize] / 2
                    offset -= thumb_mouse_offset
                    // refEl.scroll_box[scrollPos] = Math.round(offset * math_temp)
                }
            }
            
        }

        track.addEventListener('pointerup', track_up)
        track.addEventListener('pointermove', track_move)
        track.setPointerCapture(e.pointerId)
        
    }

    return {
        cfg,
        sensitivity,
        itemY,
        thumbRef,
        track_down,
    }
}
