// 过界(overscroll)能力 —— 与 hint UI 解耦的独立模块
//
// 职责：
//  1. update(axis): 依据当前 scroll / maxScroll 判定并写入 before/after/'' 标记
//  2. applyLimit({x, y}): 由装配层(主组件)注入各轴允许的最大过界拉伸量。
//     当前上限来自 hint 的 UI 尺寸(showHint=true 时 hint.size.*.max)，
//     未来可平滑接入独立的 overscroll 开关，使"过界橡皮筋"与"提示 UI"彻底分离。
export default function useOverscroll(runtimeData) {
    /**
     * 依据当前滚动位置刷新 axis 轴的过界标记
     * @param {'x' | 'y'} axis
     */
    const update = (axis) => {
        const pos = runtimeData.scroll[axis]
        const max = runtimeData.maxScroll[axis]

        if (pos < 0) {
            runtimeData.overscroll[axis] = 'before'
        } else if (pos > max) {
            runtimeData.overscroll[axis] = 'after'
        } else {
            runtimeData.overscroll[axis] = ''
        }
    }

    /**
     * 应用各轴允许的最大过界拉伸量（尺寸变化时由装配层调用）
     * @param {{ x: number, y: number }} limit
     */
    const applyLimit = ({ x, y }) => {
        runtimeData.maxOverscroll.x = x
        runtimeData.maxOverscroll.y = y
    }

    return { update, applyLimit }
}
