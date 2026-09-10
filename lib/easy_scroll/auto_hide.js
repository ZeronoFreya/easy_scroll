// 滚动条 auto-hide 可见性决策（纯函数，便于单测）
//
// 显隐仅控制 opacity/pointer-events(CSS 过渡)，不增删滚动条 DOM。
// 可见条件：
//   1. 未开启 autoHide           → 恒可见(行为不变)
//   2. autoHide 且正在拖动 thumb → 拖动期间可见(指针捕获中断后不闪没)
//   3. autoHide 且滚动区域/滚动条 hover → 可见
export function calcScrollBarVisible(autoHide, draging, hover) {
    if (!autoHide) return true
    if (draging) return true
    return !!hover
}
