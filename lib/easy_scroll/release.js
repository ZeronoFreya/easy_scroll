// 释放输入后的统一"归位决策"
//
// 这是未来 overscroll 仲裁器 / kernel.endControl 的雏形：
// 各输入源（滚动条拖动、中键导航、hint 倒计时结束）在释放时只调用本函数，
// 由它统一决定：是保持当前位置（仍在拖动 / hint 倒计时中），
// 还是触发 back 快速回弹过渡，并把位置 clamp 回合法区间。
//
// 不依赖任何兄弟扩展：需要"挂起归位"的方(当前为 hint 的倒计时)
// 只需把仲裁标记写入 runtimeData.countdown.y.run，本函数读取内核状态即可。
import { clamp } from './utils.js'

/**
 * @param {object} runtimeData 内核运行状态（scroll / maxScroll / draging / back / countdown）
 * @returns {boolean} true = 已执行归位
 */
export default function release(runtimeData) {
    // 仍在拖动：不打断，位置继续由拖动方控制
    if (runtimeData.draging) return false
    // hint 倒计时进行中：保持过界位置，等待倒计时结束再归位
    if (runtimeData.countdown.y.run) return false

    runtimeData.back = true
    runtimeData.scroll.y = clamp(runtimeData.scroll.y, 0, runtimeData.maxScroll.y)
    return true
}
