export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v))
}

export function safeDivide(b, c, defaultValue = 0) {
    return c === 0 ? defaultValue : b / c
}

