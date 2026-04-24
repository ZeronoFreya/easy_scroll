export function clamp(v, min, max){
    return Math.max(min, Math.min(max, v))
}

export function safeDivide(b, c, defaultValue = 0) {
    return c === 0 ? defaultValue : b / c;
}

// export function proxyValue(val, min = -Infinity, max = Infinity) {
//     let value = val
//     let _min = min
//     let _max = max

//     const _clamp = (v) => Math.max(_min, Math.min(_max, v));

//     return {
//         get value() {
//             return value
//         },
//         set value(v) {
//             value = v
//         },
//         set clamp(v) {
//             value = _clamp(v)
//         },
//         setBounds(newMin, newMax) {
//             _min = newMin
//             _max = newMax
//             value = _clamp(value)
//         },
//         abs(){
//             return Math.abs(value)
//         }
//     }
// }
