
export default {
    scrollAxis: {
        type: String,
        default: 'xy',
        validator: (value) => ['x', 'y', 'xy'].includes(value)
    },
    scrollBar: {
        type: Boolean,
        default: true
    },
    scrollJoy: {
        type: Boolean,
        default: false
    },
    /**
     * 滚动条显示在容器内部，会遮挡内容
     */
    scrollInside: {
        type: Boolean,
        default: false
    },
    /**
     * 滚动条位置反转到对侧，即: y轴在左侧，x轴在上方
     */
    scrollReverse: {
        type: Boolean,
        default: false
    },
    /**
     * 滚动条 teleport 目标(选择器)。
     * 空字符串: 不传送, 滚动条保留在组件容器内(默认)。
     * 传入选择器(如 'body' 或 '.float-layer'): 滚动条渲染到该目标, 适合容器被裁剪/需浮层显示的场合。
     */
    teleport: {
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
        type: Boolean,
        default: false
    },
}