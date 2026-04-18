// 鼠标中键导航
import { ref, reactive, onBeforeUnmount, computed } from 'vue'

export default function useMidNav(runtimeData, boxRef, startLoop) {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.1,
    })

    let middleMouseStartY = 0

    const startPos = ref({
        x: 0,
        y: 0,
    })

    const cursorPos = ref({
        x: -100,
        y: -100,
    })

    const handleMouseMove = (e) => {
        if (!runtimeData.isMiddleMouseActive) return
        runtimeData.virtualItemY = e.clientY - middleMouseStartY

        cursorPos.value = {
            x: e.clientX,
            y: e.clientY,
        }
    }

    const handleMiddleMouseStop = (e) => {
        if (e.button !== 1) return
        runtimeData.isMiddleMouseActive = false
        runtimeData.virtualItemY = 0
        document.documentElement.style.cursor = ''
        document.body.style.pointerEvents = 'auto'
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mousedown', handleMiddleMouseStop)
        cursorPos.value = {
            x: -100,
            y: -100,
        }
    }

    const toggleMiddleMouse = (e) => {
        e.stopPropagation()
        if (e.button !== 1 || runtimeData.isMiddleMouseActive) return

        runtimeData.isMiddleMouseActive = true
        runtimeData.inputSource = 'middle'
        startLoop() // 唤醒

        middleMouseStartY = e.clientY
        runtimeData.virtualItemY = 0

        document.documentElement.style.cursor = 'none'
        document.body.style.pointerEvents = 'none'

        startPos.value = {
            x: e.clientX,
            y: e.clientY,
        }

        cursorPos.value = {
            x: e.clientX,
            y: e.clientY,
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mousedown', handleMiddleMouseStop)
    }
    const init = () => {
        boxRef.value.addEventListener('mousedown', toggleMiddleMouse)

        // const id = 'es_mid_nav_cursor'
        // let el = document.getElementById(id);
        // if(!el){
        //     el = document.createElement('div')
        //     el.setAttribute('id', );
        //     el.style.pointerEvents = 'none'
        //     document.body.appendChild(el);
        // }
    }

    onBeforeUnmount(() => {
        boxRef.value.removeEventListener('mousedown', toggleMiddleMouse)
    })
    return {
        cfg,
        init,
        startPos,
        cursorPos,
    }
}
