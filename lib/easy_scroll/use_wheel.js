// 鼠标滚轮：把滚轮增量按启用轴路由为内核滚动输入
//
// 轴路由规则：
//   'x'  纯横向面板：滚轮纵向分量(及触控板横向分量)均作用于 x
//   'y'  纯纵向：仅响应纵向分量(如需横滚请用 'x'/'xy')
//   'xy' 常规：纵向滚动 + shift+滚轮 或 触控板横向分量 均作用于 x
//
// 步进统一由 readWheel 提供(wheelDelta 语义)，兼容 Firefox(无 wheelDeltaX/Y)。
import { clamp, readWheel } from './utils.js'

export default function useWheel(runtimeData, scrollAxis = 'a') {
    const onWheel = (e) => {
        const { x, y } = runtimeData.maxOverscroll
        const { x: horizontal, y: vertical } = readWheel(e)

        const scrollX = (delta) => {
            runtimeData.scroll.x = clamp(runtimeData.scroll.x - delta, -x, runtimeData.maxScroll.x + x)
        }
        const scrollY = (delta) => {
            runtimeData.scroll.y = clamp(runtimeData.scroll.y - delta, -y, runtimeData.maxScroll.y + y)
        }

        if (scrollAxis === 'x') {
            const d = horizontal || vertical
            if (d) scrollX(d)
        } else if (scrollAxis === 'y') {
            if (vertical) scrollY(vertical)
        } else {
            // 'xy' == 'a'
            if (e.shiftKey) {
                if (vertical) scrollX(vertical)
            } else {
                if (vertical) scrollY(vertical)
                if (horizontal) scrollX(horizontal)
            }
        }
    }

    return { onWheel }
}
