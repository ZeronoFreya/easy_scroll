import { customRef, onUnmounted } from 'vue'

/**
 * 包装一个布尔值，使其具有延时自动重置和重置计时器的能力
 * @param delay 延时时间（毫秒），默认 300
 * @returns 一个响应式布尔值 ref，直接赋值 true/false 即可触发相应行为
 */
function useAutoResetBool(delay = 300) {
    let timer = null
    let value = false

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer)
            timer = null
        }
    }

    const boolRef = customRef((track, trigger) => ({
            get() {
                track()
                return value
            },
            set(newVal) {
                if (newVal === true) {
                    // 重置已有计时器
                    clearTimer()
                    const changed = value !== true
                    value = true
                    if (changed) trigger() // 仅在值真正变化时触发视图更新

                    // 启动新计时器
                    const newTimer = setTimeout(() => {
                        // 只有当前计时器仍是这个新计时器时才执行，避免被后续重置干扰
                        if (timer === newTimer) {
                            value = false
                            timer = null
                            trigger()
                        }
                    }, delay)
                    timer = newTimer
                } else {
                    // 手动设置为 false 时清空计时器
                    clearTimer()
                    if (value !== false) {
                        value = false
                        trigger()
                    }
                }
            },
            __v_isRef: true,
        }))

    // 组件卸载时清理计时器，避免内存泄漏
    onUnmounted(clearTimer)

    return boolRef
}

export default useAutoResetBool

// 使用示例
// const active = useAutoResetBool(300)
