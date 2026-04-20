// 摇杆
import { ref, reactive } from 'vue'
import { clamp } from './utils.js'

export default function useScrollbar(runtimeData, startLoop, joyStickMode) {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.2,
    })

    // 灵敏度
    const sensitivity = ref(0.1)

    const itemY = ref(0)

    let math_temp = 0
    let thumb_mouse_offset = 0

    let itemStartY = 0

    const thumbs = reactive({
        x: null,
        y: null,
    })

    const maxDistance = {
        x: 0,
        y: 0,
    }

    const init = () => {
        // thumb.x =
    }

    const track_up = (e) => {
        runtimeData.isDragging = false
        const track = e.currentTarget
        if (joyStickMode) {
            itemY.value = 0
            if (thumbs.y) {
                thumbs.y.style.transform = `translate(-50%, 0px)`
            }
        } else {
            // track.classList.remove('es_track_down')
            math_temp = 0
            thumb_mouse_offset = 0
        }

        track.releasePointerCapture(e.pointerId)
        track.removeEventListener('pointermove', track_move)
        track.removeEventListener('pointerup', track_up)

        // thumb = null
        // resetTime(scroll)
    }

    const track_move = (e) => {
        // console.log(666);
        if (!runtimeData.isDragging) return
        const track = e.currentTarget

        if (joyStickMode) {
            let deltaY = e.clientY - itemStartY
            const maxDistance = (track.offsetHeight - thumbs.y.offsetHeight) * 0.5
            itemY.value = clamp(deltaY, -maxDistance, maxDistance)
        } else {
            let deltaY = e.clientY - itemStartY
            const maxDistance = track.offsetHeight - thumbs.y.offsetHeight
            itemY.value = clamp(deltaY, 0, maxDistance)
        }

        thumbs.y.style.transform = `translate(-50%, ${itemY.value}px)`
    }

    const track_down = (e) => {
        if (runtimeData.isMiddleMouseActive || e.button != 0) return

        const track = e.currentTarget
        const scroll = track.dataset.scroll
        const thumb = track.querySelector('[thumb]')
        if (!thumb) return
        thumbs[scroll] = thumb

        if (joyStickMode) {
            if (e.target !== thumb) {
                return
            }
            itemStartY = e.clientY
        } else {
            // track.classList.add('es_track_down')
            const offsetSize = scroll == 'x' ? 'offsetWidth' : 'offsetHeight'
            // let offset = scroll == 'x' ? e.offsetX : e.offsetY
            // math_temp = refEl.scroll_content[offsetSize] / track[offsetSize]

            if (e.target === thumb) {
                // 拖拽 thumb: 使用点击的位置
                // thumb_mouse_offset = e.clientY - e.offsetY
                itemStartY = e.clientY - itemY.value
            } else {
                // 在 track 拖拽: 使用 thumb 的中心
                // thumb_mouse_offset = thumb[offsetSize] / 2
                // offset -= thumb_mouse_offset
                // refEl.scroll_box[scrollPos] = Math.round(offset * math_temp)
                console.log(track.offsetTop);
                
                itemY.value = e.offsetY - thumb[offsetSize] * 0.5
                thumbs.y.style.transform = `translate(-50%, ${itemY.value}px)`
                itemStartY = e.clientY - itemY.value
            }
        }

        runtimeData.isDragging = true
        runtimeData.inputSource = 'stick'
        startLoop() // 唤醒

        track.addEventListener('pointerup', track_up)
        track.addEventListener('pointermove', track_move)
        track.setPointerCapture(e.pointerId)
    }

    const resize = (boxw, boxh) => {}

    return {
        sensitivity,
        itemY,
        init,
        track_down,
        resize,
    }
}
