import type { DefineComponent } from 'vue'

declare const EasyScroll: DefineComponent<
    {
        /**
         * 允许滚动的轴
         * - 'x' 仅横向
         * - 'y' 仅纵向
         * - 'a' 双向（默认）
         * @default 'a'
         */
        scrollAxis?: 'x' | 'y' | 'a'

        /**
         * 是否显示滚动条（对应轴内容溢出时；'a' 时含横向/纵向两条）
         * @default true
         */
        scrollBar?: boolean

        /**
         * 滚动条摇杆模式：'' = 普通拖动；'x' / 'y' / 'a' = 启用对应轴的摇杆
         * @default ''
         */
        scrollJoy?: '' | 'x' | 'y' | 'a'

        /**
         * 滚动条自动隐藏：鼠标进入滚动区域时渐显、移出时渐隐。
         * 仅用 opacity + CSS 过渡控制显隐，不卸载滚动条 DOM。
         * @default false
         */
        scrollAutoHide?: boolean

        /**
         * 滚动条偏移 translate 值（y 轴条左右位置 / x 轴条上下位置）
         * @default '0%'
         */
        offsetScrollX?: string

        /**
         * 滚动条偏移 translate 值
         * @default '0%'
         */
        offsetScrollY?: string

        /**
         * 滚动条位置反转到对侧，即: y轴在左侧，x轴在上方。'' 或 'x' / 'y' / 'a'
         * @default ''
         */
        scrollReverse?: '' | 'x' | 'y' | 'a'

        /**
         * 滚动条 teleport 目标(选择器)。空字符串(默认)=不传送,保留在组件容器内;
         * 传入如 'body' 或 '.float-layer' 则滚动条渲染到该目标
         * @default ''
         */
        teleportX?: string

        /**
         * 滚动条 teleport 目标(选择器)，同 teleportX 作用于 y 轴
         * @default ''
         */
        teleportY?: string

        /**
         * 颜色主题: 'light' / 'dark' / 'auto'(跟随系统 prefers-color-scheme)
         * @default 'auto'
         */
        theme?: 'light' | 'dark' | 'auto'

        /**
         * 是否启用鼠标中键平移导航
         * @default false
         */
        midMouseNav?: boolean

        /**
         * 是否启用过界提示面板（顶部下拉/底部上拉/左侧/右侧）
         * @default false
         */
        showHint?: boolean

        /**
         * 自适应尺寸：'' = 禁用；'x' / 'y' / 'a' = 指定方向收缩到内容尺寸
         * @default ''
         */
        autoSize?: '' | 'x' | 'y' | 'a'
    },
    {},
    {},
    {},
    {},
    {
        /**
         * 默认内容插槽；未提供时显示内置示例列表。
         * 命名插槽: hint_top / hint_bottom / hint_left / hint_right / scroll_y / scroll_x
         */
        default?: () => unknown
    }
>

export default EasyScroll
