declare const _default: import('vue').DefineComponent<
    {
        /**
         * 滚动方向
         * @default 'xy'
         */
        scrollAxis?: 'x' | 'y' | 'xy'

        /**
         * 是否使用滚动条
         * @default true
         */
        scrollBar?: boolean

        /**
         * 滚动条启用摇杆模式
         * @default false
         */
        scrollJoy?: boolean

        /**
         * 是否使用鼠标中键导航
         * @default false
         */
        midMouseNav?: boolean

        /**
         * 是否使用过界提示
         * @default false
         */
        overTip?: boolean
    },
    {
        /**
         * 滚动到指定位置
         * @param x X坐标
         * @param y Y坐标
         */
        scrollTo: (x: number, y: number) => void
        /**
         * 滚动到顶部
         */
        scrollToTop: () => void
        /**
         * 滚动到底部
         */
        scrollToBottom: () => void
    }
>
export default _default
