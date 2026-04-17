// 摇杆
import { reactive } from "vue"

export default function useStick() {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.2
    })
    return {
        cfg
    }
}