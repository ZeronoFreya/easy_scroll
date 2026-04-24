// 鼠标中键导航
import { ref, reactive, onBeforeUnmount, computed } from 'vue'

export default function useMidNav(runtimeData, boxRef, startLoop) {

    const active = ref(false)

    // 灵敏度
    const sensitivity = ref(0.1)

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

    const handleMouseMove = ({clientX, clientY}) => {
        if (runtimeData.currCtrlType !== 'midnav') return
       
        virtualPos.x = clientX - startPos.value.x
        virtualPos.y = clientY - startPos.value.y

        cursorPos.value = {
            x: clientX,
            y: clientY,
        }
    }

    const handleMiddleMouseStop = (e) => {
        if (e.button !== 1) return
        runtimeData.currCtrlType = ''
       
        virtualPos.x = 0
        virtualPos.y = 0

        cursorPos.value = {
            x: -100,
            y: -100,
        }

        document.documentElement.style.cursor = ''
        document.body.style.pointerEvents = 'auto'
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mousedown', handleMiddleMouseStop)
        
        active.value = false
    }

    const toggleMiddleMouse = (e) => {
        e.stopPropagation()
        if (e.button !== 1 || runtimeData.currCtrlType == 'midnav') return

        runtimeData.inputSource = 'middle'
        runtimeData.currCtrlType = 'midnav'
        startLoop() // 唤醒

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

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mousedown', handleMiddleMouseStop)

        active.value = true
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
        sensitivity,
        init,
        active,
        startPos,
        cursorPos,
        virtualPos,
    }
}
