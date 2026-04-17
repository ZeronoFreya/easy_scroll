// 鼠标中键导航
import { reactive } from "vue"

export default function useMidNav() {
    const cfg = reactive({
        // 灵敏度
        sensitivity: 0.1
    })
    return {
        cfg
    }
}