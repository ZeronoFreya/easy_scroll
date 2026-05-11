// 鼠标滚轮
import { ref, reactive, onBeforeUnmount, computed } from 'vue'
import { clamp } from './utils.js'

export default function useWheel(runtimeData, hint) {
    
    // 灵敏度
    // const sensitivity = ref(0.05)

    // let freezeTimer = null
    // // 滚轮悬停延迟
    // const freezeDelay = 500

    // const cancelTimer = () => {
    //     // if (freezeTimer) {
    //     //     clearTimeout(freezeTimer)
    //     //     freezeTimer = null
    //     // }
    // }

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
    

    const onWheel = ({shiftKey, wheelDeltaY}) => {        
        const {x, y} = runtimeData.maxOverscroll

        if(shiftKey){
            runtimeData.scroll.x = clamp(
                runtimeData.scroll.x + wheelDeltaY,
                -runtimeData.maxScroll.x - x,
                x
            )             
        }else{ 
            runtimeData.scroll.y = clamp(
                runtimeData.scroll.y - wheelDeltaY,
                -y,
                runtimeData.maxScroll.y + y
            )       
                 
        }

        if (hint) {
            hint.wheel(wheelDeltaY)
        }
    }
    // const onWheel2 = (e) => {
    //     if (runtimeData.currCtrlType != '') return

    //     // 唤醒引擎
    //     startLoop()

    //     // runtimeData.inputSource = 'wheel'

    //     // if (runtimeData.scroll.y > 0 || runtimeData.scroll.y < -runtimeData.maxScroll.y) {
    //     //     if (showHint) {
    //     //         runtimeData.isWheelFreezing = true
    //     //         delayBack()
    //     //     } else {
    //     //         runtimeData.isWheelFreezing = false
    //     //     }
    //     // }

    //     const maxWheelSpeed = 30
    //     let impulse = -e.deltaY * sensitivity.value

    //     runtimeData.velocity = clamp(runtimeData.velocity + impulse, -maxWheelSpeed, maxWheelSpeed)
    // }

    // onBeforeUnmount(() => {
    //     cancelTimer()
    // })

    return {
        onWheel,
        // cancelTimer,
    }
}
