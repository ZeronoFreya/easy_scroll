import { ref, reactive, onBeforeUnmount, computed } from 'vue'

export default function useHint(runtimeData, startLoop) {
    const topPullRatio = ref(0)
    const bottomPullRatio = ref(0)

    const topH = computed(() => Math.ceil(Math.max(0, runtimeData.scroll.y)))
    const topHintStyle = computed(() => ({ height: `${topH.value}px` }))
    // const topHintStyle2 = computed(() => {
    //     const h = runtimeData.currCtrlType != '' ? Math.max(0, runtimeData.scroll.y) : 0
    //     return { height: `${h}px` }
    // })

    const heightValue = computed(() => {
        return Math.ceil(Math.max(0, -runtimeData.scroll.y - runtimeData.maxScroll.y))
    })
    // const heightValue2 = computed(() => {
    //     if(runtimeData.scroll.y > 0 || runtimeData.scroll.y > -runtimeData.maxScroll.y) return 0
    //     const h = -runtimeData.scroll.y - runtimeData.maxScroll.y
    //     return (h > 0 && runtimeData.currCtrlType != '') ? Math.ceil(h) : 0
    // })
    const bottomHintStyle = computed(() => ({ height: `${heightValue.value}px` }))

    return {
        topPullRatio,
        bottomPullRatio,
        topHintStyle,
        bottomHintStyle,
    }
}
