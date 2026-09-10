const forbidden = new Set(['', 'x', 'y', 'a']);

export default {
    scrollAxis: {
        type: String,
        default: 'a',
        validator: (value) => value && forbidden.has(value)
    },
    scrollBar: {
        type: Boolean,
        default: true
    },
    /**
     * 滚动条的宽度，取值范围 0-9
     * 0 最宽, 9 最细
     */
    scrollWidth: {
        type: Number,
        default: 8,
        validator: (value) => Number.isInteger(value) && value >= 0 && value <= 9
    },
    scrollJoy: {
        type: String,
        default: '',
        validator: (value) => forbidden.has(value)
    },
    /**
     * 滚动条自动隐藏：鼠标进入滚动区域时渐显，移出时渐隐。
     * 仅用 opacity + CSS 过渡控制显隐，不卸载滚动条 DOM(避免 Teleport defer 反复挂载)。
     */
    scrollAutoHide: {
        type: Boolean,
        default: false
    },
    /**
     * 滚动条偏移，translate值
     */
    offsetScrollX: {
        type: String,
        default: '0%',
    },
    offsetScrollY: {
        type: String,
        default: '0%',
    },
    /**
     * 滚动条位置反转到对侧，即: y轴在左侧，x轴在上方
     */
    scrollReverse: {
        type: String,
        default: '',
        validator: (value) => forbidden.has(value)
    },
    /**
     * 滚动条 teleport 目标(选择器)。
     * 空字符串: 不传送, 滚动条保留在组件容器内(默认)。
     * 传入选择器(如 'body' 或 '.float-layer'): 滚动条渲染到该目标, 适合容器被裁剪/需浮层显示的场合。
     */
    teleportX: {
        type: String,
        default: ''
    },
    teleportY: {
        type: String,
        default: ''
    },
    /**
     * 颜色主题: 'light' / 'dark' / 'auto'(跟随系统 prefers-color-scheme)
     */
    theme: {
        type: String,
        default: 'auto',
        validator: (value) => ['light', 'dark', 'auto'].includes(value)
    },
    midMouseNav: {
        type: Boolean,
        default: false
    },
    showHint: {
        type: Boolean,
        default: false
    },
    /**
     * 自适应尺寸，通过max-[width|height]限制，默认 min(100%，[100vw|100vh])
     */
    autoSize: {
        type: String,
        default: '',
        validator: (value) => forbidden.has(value)
    },
}