import { ref, reactive, onBeforeUnmount, computed } from 'vue'

export default function useHint(runtimeData, startLoop) {
    const topPullRatio = ref(0)
    const bottomPullRatio = ref(0)

    const topHintStyle = computed(() => {
        const h = Math.max(0, runtimeData.scroll.top)
        // const h = 0
        return { height: `${h}px` }
    })

    const heightValue = computed(() => {
        if(runtimeData.scroll.top > 0 || runtimeData.scroll.top > -runtimeData.maxScroll.top) return 0
        const h = -runtimeData.scroll.top - runtimeData.maxScroll.top
        return h > 0 ? Math.ceil(h) : 0
    })
    const bottomHintStyle = computed(()=>({ height: `${heightValue.value}px` }))


    return {
        topPullRatio,
        bottomPullRatio,
        topHintStyle,
        bottomHintStyle,
    }
}
