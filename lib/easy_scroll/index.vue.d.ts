import type { DefineComponent } from 'vue'

declare const EasyScroll: DefineComponent<
    {
        /**
         * 允许滚动的轴
         * - 'x' 仅横向
         * - 'y' 仅纵向
         * - 'xy' 双向（默认）
         * @default 'xy'
         */
        scrollAxis?: 'x' | 'y' | 'xy'

        /**
         * 是否显示滚动条（'xy' 时含横向/纵向两条）
         * @default true
         */
        scrollBar?: boolean

        /**
         * 滚动条启用摇杆模式（目前作用于纵向轨道）
         * @default false
         */
        scrollJoy?: boolean

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
         * 滚动条 teleport 目标(选择器)。空字符串(默认)=不传送,保留在组件容器内;
         * 传入如 'body' 或 '.float-layer' 则滚动条渲染到该目标
         * @default ''
         */
        teleport?: string
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
