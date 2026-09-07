// 鼠标滚轮
import { clamp } from './utils.js'

export default function useWheel(runtimeData, scrollAxis = 'xy') {
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

    // 轴路由规则：
    //   'x'  纯横向面板：滚轮纵向分量(及触控板横向分量)均作用于 x
    //   'y'  纯纵向：仅响应纵向分量(不再支持 shift 转横，如需横滚请用 'x'/'xy')
    //   'xy' 常规：纵向滚动 + shift+滚轮 或 触控板横向分量 均作用于 x
    const onWheel = (e) => {
        const { x, y } = runtimeData.maxOverscroll
        const vertical = e.wheelDeltaY ?? 0
        const horizontal = e.wheelDeltaX ?? 0

        const scrollX = (delta) => {
            runtimeData.scroll.x = clamp(runtimeData.scroll.x - delta, -x, runtimeData.maxScroll.x + x)
        }
        const scrollY = (delta) => {
            runtimeData.scroll.y = clamp(runtimeData.scroll.y - delta, -y, runtimeData.maxScroll.y + y)
        }

        if (scrollAxis === 'x') {
            const d = horizontal || vertical
            if (d) scrollX(d)
        } else if (scrollAxis === 'y') {
            if (vertical) scrollY(vertical)
        } else {
            // 'xy'
            if (e.shiftKey) {
                if (vertical) scrollX(vertical)
            } else {
                if (vertical) scrollY(vertical)
                if (horizontal) scrollX(horizontal)
            }
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
