// 鼠标滚轮
import { reactive } from 'vue'
import { clamp } from './utils.js'

export default function useWheel(runtimeData, loop) {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.05,
    })
    let freezeTimer = null;
    // 滚轮悬停延迟
    const freezeDelay = 500;
    const onWheel = (e) => {
        if (runtimeData.isDragging || runtimeData.isMiddleMouseActive) return
        runtimeData.inputSource = 'wheel'
        
        if (runtimeData.scroll.y > 0 || runtimeData.scroll.y < runtimeData.maxScroll) {
            runtimeData.isWheelFreezing = true
            if (freezeTimer) clearTimeout(freezeTimer)
            freezeTimer = setTimeout(() => {
                runtimeData.isWheelFreezing = false
            }, freezeDelay)
        }

        const maxWheelSpeed = 30
        let impulse = -e.deltaY * cfg.sensitivity

        // runtimeData.velocity += impulse

        runtimeData.velocity = clamp(runtimeData.velocity + impulse, -maxWheelSpeed, maxWheelSpeed)
        // loop()
    }

    return {
        cfg,
        onWheel,
    }
}
