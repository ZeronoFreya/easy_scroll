import { ref, reactive, watch } from 'vue'
import release from './release.js'

// 过界提示(Hint)扩展 —— 四向(上/下/左/右)统一展示层状态与轮子方向响应。
//
// 归位仲裁状态 countdown 已上移至共享内核 runtimeData.countdown：
// 输入扩展与 release() 都通过内核读取/写入，hint 不再独占，兄弟间零引用。
//
// Y 轴语义: before=顶部(scroll.y<0) after=底部(scroll.y>max)
// X 轴语义: before=左侧(scroll.x<0) after=右侧(scroll.x>max)
// 滚动方向语义与轴无关: 同向过界继续滚 → 重置倒计时; 反向滚 → 立即归位。
export default function useHint(runtimeData) {
    const pullRatio = reactive({
        x: {
            before: 0,
            after: 0,
        },
        y: {
            before: 0,
            after: 0,
        },
    })
    const max = {
        x: 200,
        y: 200,
    }
    const size = reactive({
        x: {
            before: 0,
            after: 0,
            max: max.x,
        },
        y: {
            width: 0,
            before: 0,
            after: 0,
            max: max.y,
        },
    })

    // 鼠标是否悬停在对应轴的面板上（悬停时冻结自动回弹，等待离开）
    const mouseInHint = reactive({ x: false, y: false })

    // 任一输入源(拖动)开始: 取消进行中的倒计时并重置进度条 key。
    // 原由各输入扩展在按下时调用 hint.resetCountdown()，现收敛为
    // 本模块对内核 draging 上升沿的观察，消除扩展对 hint 的引用。
    watch(
        () => runtimeData.draging,
        (now, prev) => {
            if (now && !prev) {
                for (const axis of ['x', 'y']) {
                    runtimeData.countdown[axis].run = false
                    runtimeData.countdown[axis].key += 1
                }
            }
        },
    )

    const update = (scroll) => {
        const val = runtimeData.scroll[scroll]
        const maxVal = runtimeData.maxScroll[scroll]
        let before_r = 0
        let after_r = 0
        let before_s = 0
        let after_s = 0
        switch (runtimeData.overscroll[scroll]) {
            case 'before':
                before_r = Math.abs(val) / 80
                before_s = Math.abs(Math.ceil(Math.min(0, val)))
                break
            case 'after':
                after_r = Math.abs(val + maxVal) / 80
                after_s = Math.abs(Math.ceil(Math.min(0, -val + maxVal)))
                break
        }

        pullRatio[scroll].before = before_r
        pullRatio[scroll].after = after_r

        size[scroll].before = before_s
        size[scroll].after = after_s
    }

    // 仅维护自身 UI 尺寸；maxOverscroll 的上限交由过界能力模块
    // (use_overscroll.applyLimit) 由装配层注入，避免 hint 越权设置滚动边界
    const resize = () => {
        size.x.max = Math.min(runtimeData.viewportSize.w, max.x)
        size.y.max = Math.min(runtimeData.viewportSize.h, max.y)

        size.y.width = runtimeData.viewportSize.w
    }

    // 过界区内继续滚轮: 同向 → 重置倒计时; 反向 → 直接归位。
    // axis 由装配层按实际滚动的轴传入。
    const wheel = (wheelDelta, axis = 'y') => {
        const over = runtimeData.overscroll[axis]

        if (over === 'before') {
            if (wheelDelta >= 0) {
                // 同向(继续向 before 方向): 重置倒计时
                if (!mouseInHint[axis]) runtimeData.countdown[axis].key += 1
            } else {
                // 反向: 归位到边界
                runtimeData.back = true
                runtimeData.scroll[axis] = 0
            }
        } else if (over === 'after') {
            if (wheelDelta < 0) {
                // 同向(继续向 after 方向): 重置倒计时
                if (!mouseInHint[axis]) runtimeData.countdown[axis].key += 1
            } else {
                // 反向: 归位到边界
                runtimeData.back = true
                runtimeData.scroll[axis] = runtimeData.maxScroll[axis]
            }
        }
    }

    const countdownEnd = (axis = 'y') => {
        if (runtimeData.draging) {
            runtimeData.countdown[axis].run = false
            return
        }

        // 倒计时结束: 先复位, 再交由统一归位决策快速回弹
        runtimeData.countdown[axis].run = false
        release(runtimeData, axis)
    }
    const countdownStart = (axis = 'y') => {
        runtimeData.countdown[axis].run = true
    }

    return {
        pullRatio,
        size,
        mouseInHint,
        update,
        resize,
        wheel,
        countdownEnd,
        countdownStart,
    }
}
