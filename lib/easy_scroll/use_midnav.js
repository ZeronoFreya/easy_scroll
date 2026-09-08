// 鼠标中键导航
import { ref, reactive, onBeforeUnmount } from 'vue'
import { clamp } from './utils.js'
import release from './release.js'

export default function useMidNav(runtimeData, boxRef, scrollAxis = 'a') {
    const active = ref(false)

    const allowX = scrollAxis === 'a' || scrollAxis === 'x'
    const allowY = scrollAxis === 'a' || scrollAxis === 'y'

    // 灵敏度
    const sensitivity = ref(0.05)

    // 初始位置
    const startPos = ref({
        x: 0,
        y: 0,
    })

    // 光标位置
    const cursorPos = ref({
        x: -100,
        y: -100,
    })

    const virtualPos = reactive({
        x: 0,
        y: 0,
    })


    let loopContinue = false
    const myLoop = () => {
        const { x, y } = runtimeData.maxOverscroll

        // 中键导航: 鼠标位移映射为双轴滚动速度
        if (allowX) {
            runtimeData.scroll.x = clamp(
                runtimeData.scroll.x + virtualPos.x * sensitivity.value,
                -x,
                runtimeData.maxScroll.x + x
            )
        }
        if (allowY) {
            runtimeData.scroll.y = clamp(
                runtimeData.scroll.y + virtualPos.y * sensitivity.value,
                -y,
                runtimeData.maxScroll.y + y
            )
        }

        if (loopContinue) {
            runtimeData.rafId = requestAnimationFrame(myLoop)
        }
    }

    const handleMouseMove = ({ clientX, clientY }) => {
        if (runtimeData.currCtrlType !== 'midnav') return

        virtualPos.x = clientX - startPos.value.x
        virtualPos.y = clientY - startPos.value.y

        cursorPos.value = {
            x: clientX,
            y: clientY,
        }
    }

    // 统一停止导航: 停循环/取消 rAF/清状态/移除 window 监听/恢复 DOM 样式。
    // 用户松开中键与组件卸载(激活中被移除)共用, 避免 rAF 与监听泄漏。
    const stopNav = () => {
        runtimeData.currCtrlType = ''
        runtimeData.draging = false

        loopContinue = false
        cancelAnimationFrame(runtimeData.rafId)

        virtualPos.x = 0
        virtualPos.y = 0

        cursorPos.value = {
            x: -100,
            y: -100,
        }

        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mousedown', handleMiddleMouseStop)
        window.removeEventListener('mouseup', preventMouseUp)

        document.documentElement.style.cursor = ''
        document.body.style.pointerEvents = 'auto'

        active.value = false
    }

    const handleMiddleMouseStop = (e) => {
        if (e.button !== 1) return
        stopNav()

        // 释放后统一归位决策：各轴倒计时中保持，否则快速回弹
        if (allowY) release(runtimeData, 'y')
        if (allowX) release(runtimeData, 'x')
    }

    const preventMouseUp = (e) => {
        if (e.button !== 1) return
        e.preventDefault()
        e.stopPropagation()
        // 第一次抬起中键后光标显示, 莫名奇妙
        document.documentElement.style.cursor = 'none'
    }

    const toggleMiddleMouse = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.button !== 1 || runtimeData.currCtrlType == 'midnav') return

        runtimeData.currCtrlType = 'midnav'
        runtimeData.draging = true

        loopContinue = true
        runtimeData.rafId = requestAnimationFrame(myLoop)

        startPos.value = {
            x: e.clientX,
            y: e.clientY,
        }

        cursorPos.value = {
            x: e.clientX,
            y: e.clientY,
        }

        virtualPos.x = 0
        virtualPos.y = 0

        document.documentElement.style.cursor = 'none'
        document.body.style.pointerEvents = 'none'

        window.addEventListener('mousemove', handleMouseMove, false)
        window.addEventListener('mousedown', handleMiddleMouseStop, false)
        window.addEventListener('mouseup', preventMouseUp, false)

        active.value = true
    }
    const init = () => {
        boxRef.value.addEventListener('mousedown', toggleMiddleMouse, false)
    }

    onBeforeUnmount(() => {
        boxRef.value.removeEventListener('mousedown', toggleMiddleMouse)
        // 激活中被移除时兜底清理(停 rAF/移除 window 监听/恢复光标与 pointer-events)
        stopNav()
    })
    return {
        sensitivity,
        init,
        active,
        startPos,
        cursorPos,
        virtualPos,
    }
}
