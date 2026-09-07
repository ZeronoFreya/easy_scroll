// 释放输入后的统一"归位决策"
//
// 这是未来 overscroll 仲裁器 / kernel.endControl 的雏形：
// 各输入源（滚动条拖动、中键导航、hint 倒计时结束）在释放时只调用本函数，
// 由它统一决定：是保持当前位置（仍在拖动 / hint 倒计时中），
// 还是触发 back 快速回弹过渡，并把位置 clamp 回合法区间。
//
// 此前这段逻辑在 use_midnav.js / use_scrollbar.js / use_hint.js 各复制了一份，
// 且三份存在细微不一致（如 scrollbar 在倒计时中仍会先置 back）。统一后：
//   - 拖动中 / 倒计时中 → 完全不打断（返回 false）
//   - 否则 → back=true + 归位
import { clamp } from './utils.js'

/**
 * @param {object} runtimeData 内核运行状态（scroll / maxScroll / draging / back）
 * @param {object|null} hint 过界提示控制器（showHint 未启用时为 null）
 * @returns {boolean} true = 已执行归位
 */
export default function release(runtimeData, hint) {
    // 仍在拖动：不打断，位置继续由拖动方控制
    if (runtimeData.draging) return false
    // hint 倒计时进行中：保持过界位置，等待倒计时结束再归位
    if (hint && hint.countdown.y.run) return false

    runtimeData.back = true
    runtimeData.scroll.y = clamp(runtimeData.scroll.y, 0, runtimeData.maxScroll.y)
    return true
}
