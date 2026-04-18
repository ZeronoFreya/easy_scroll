// 摇杆
import { reactive } from "vue"

export default function useStick() {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.2
    })

    const itemY = ref(0);  
    return {
        cfg,
        itemY,
    }
}