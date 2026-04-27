// 鼠标滚轮
import { reactive, onBeforeUnmount } from 'vue'
import { clamp } from './utils.js'

export default function useWheel(runtimeData, startLoop, showHint) {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.05,
    })
    let freezeTimer = null
    // 滚轮悬停延迟
    const freezeDelay = 500

    const cancelTimer = () => {
        // if (freezeTimer) {
        //     clearTimeout(freezeTimer)
        //     freezeTimer = null
        // }
    }

    // const delayBack = () => {
    //     cancelTimer()

    //     // 定时器结束后，唤醒引擎进行回弹
    //     freezeTimer = setTimeout(() => {
    //         // if(runtimeData.inputSource != 'wheel'){
    //         //     return
    //         // }
    //         runtimeData.isWheelFreezing = false
    //         startLoop()
    //     }, freezeDelay)
    // }

    

    const onWheel = (e) => {
        runtimeData.scroll.y = clamp(runtimeData.scroll.y + e.wheelDeltaY, -runtimeData.maxScroll.y-200,  200)
    }
    const onWheel2 = (e) => {
        if (runtimeData.currCtrlType != '') return

        // 唤醒引擎
        startLoop()

        // runtimeData.inputSource = 'wheel'

        // if (runtimeData.scroll.y > 0 || runtimeData.scroll.y < -runtimeData.maxScroll.y) {
        //     if (showHint) {
        //         runtimeData.isWheelFreezing = true
        //         delayBack()
        //     } else {
        //         runtimeData.isWheelFreezing = false
        //     }
        // }

        const maxWheelSpeed = 30
        let impulse = -e.deltaY * cfg.sensitivity

             

        runtimeData.velocity = clamp(runtimeData.velocity + impulse, -maxWheelSpeed, maxWheelSpeed)
       
        
    }

    onBeforeUnmount(() => {
        cancelTimer()
    })

    return {
        cfg,
        onWheel,
        cancelTimer
    }
}
