import { ref, reactive, watch } from 'vue'
import release from './release.js'

// 过界提示(Hint)扩展 —— 只负责"展示层"状态与倒计时 UI 驱动。
//
// 归位仲裁状态 countdown 已上移至共享内核 runtimeData.countdown：
// 输入扩展与 release() 都通过内核读取/写入，hint 不再独占，兄弟间零引用。
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

    const mouseInHint = ref(false)

    // 任一输入源(拖动)开始时重置倒计时 key（重新走一遍进度动画）。
    // 原由各输入扩展在按下时调用 hint.resetCountdown()，现收敛为
    // 本模块对内核 draging 上升沿的观察，消除扩展对 hint 的引用。
    watch(
        () => runtimeData.draging,
        (now, prev) => {
            if (now && !prev) {
                runtimeData.countdown.y.key += 1
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

    // 过界区内继续滚轮：同向 → 重置倒计时；反向 → 直接归位。
    // 由装配层在每次 wheel 事件后桥接调用（wheel 扩展自身不感知 hint）。
    const wheel = (wheelDelta) => {
        if (wheelDelta >= 0) {
            // 上滚
            switch (runtimeData.overscroll.y) {
                case 'before':
                    // 顶部Hint内上滚, 重置
                    if (mouseInHint.value) return
                    runtimeData.countdown.y.key += 1
                    break
                case 'after':
                    // 底部Hint内上滚, 归0
                    runtimeData.back = true
                    runtimeData.scroll.y = runtimeData.maxScroll.y
                    break
            }
        } else {
            // 下滚
            switch (runtimeData.overscroll.y) {
                case 'before':
                    // 顶部Hint内, 归0
                    runtimeData.back = true
                    runtimeData.scroll.y = 0
                    break
                case 'after':
                    // 底部Hint内, 重置
                    if (mouseInHint.value) return
                    runtimeData.countdown.y.key += 1
                    break
            }
        }
    }

    const countdownEnd = () => {
        if (runtimeData.draging) {
            runtimeData.countdown.y.run = false
            return
        }

        // 倒计时结束：先复位，再交由统一归位决策快速回弹
        runtimeData.countdown.y.run = false
        release(runtimeData)
    }
    const countdownStart = () => {
        runtimeData.countdown.y.run = true
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
