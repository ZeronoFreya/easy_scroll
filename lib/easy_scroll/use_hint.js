import { ref, reactive, onBeforeUnmount, computed } from 'vue'

export default function useHint(runtimeData, startLoop) {
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
            before: 0,
            after: 0,
            max: max.y,
        },
    })

    // const topHintStyle = computed(() => ({ height: `${size.y.before}px` }))
    // const bottomHintStyle = computed(() => ({ height: `${size.y.after}px` }))

    const update = (scroll) => {
        if (runtimeData.scroll[scroll] > 0) {
            // 顶部过界
            pullRatio[scroll].before = Math.abs(runtimeData.scroll[scroll]) / 80
            pullRatio[scroll].after = 0

            size[scroll].before = Math.ceil(Math.max(0, runtimeData.scroll.y))
            size[scroll].after = 0
        } else if (runtimeData.scroll[scroll] < -runtimeData.maxScroll[scroll]) {
            // 底部过界
            pullRatio[scroll].before = 0
            pullRatio[scroll].after =
                Math.abs(runtimeData.scroll[scroll] + runtimeData.maxScroll[scroll]) / 80

            size[scroll].before = 0
            size[scroll].after = Math.ceil(
                Math.max(0, -runtimeData.scroll.y - runtimeData.maxScroll.y),
            )
        } else {
            pullRatio[scroll].before = 0
            pullRatio[scroll].after = 0

            size[scroll].before = 0
            size[scroll].after = 0
        }
    }

    const resize = () => {
        size.x.max = Math.min(runtimeData.viewportSize.w, max.x)
        size.y.max = Math.min(runtimeData.viewportSize.h, max.y)
    }

    return {
        pullRatio,
        size,
        update,
        resize,
        // topHintStyle,
        // bottomHintStyle,
    }
}
