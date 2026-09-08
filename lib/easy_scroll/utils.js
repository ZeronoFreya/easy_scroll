export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v))
}

export function safeDivide(b, c, defaultValue = 0) {
    return c === 0 ? defaultValue : b / c
}

// 标准 deltaX/Y 按 deltaMode 换算为像素量(行≈40px, 页粗略 400px), 符号不变(下/右为正)
const toPixel = (delta, mode) => {
    if (typeof delta !== 'number' || !Number.isFinite(delta)) return 0
    if (mode === 1) return delta * 40
    if (mode === 2) return delta * 400
    return delta
}

/**
 * 统一读取滚轮事件的双轴步进，返回 "wheelDelta 语义"(向上/向左为正)的像素量。
 * Chrome/Safari 提供非标准 wheelDeltaX/Y(自带行距换算)，优先使用；
 * Firefox 仅有标准 deltaX/Y + deltaMode，取反并换算(见 toPixel)；两者皆无返回 0。
 * @param {WheelEvent} e
 * @returns {{ x: number, y: number }}
 */
export function readWheel(e) {
    const mode = e.deltaMode || 0
    const px = (delta) => -toPixel(delta, mode) || 0 // 取反到 wheelDelta 语义; ||0 归一 -0
    return {
        x: typeof e.wheelDeltaX === 'number' ? e.wheelDeltaX : px(e.deltaX),
        y: typeof e.wheelDeltaY === 'number' ? e.wheelDeltaY : px(e.deltaY),
    }
}

