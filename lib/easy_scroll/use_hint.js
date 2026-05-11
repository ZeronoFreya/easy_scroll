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

    const countdown = reactive({
        x: {
            key: 0,
            run: false,
        },
        y: {
            key: 0,
            run: false,
        },
    })

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

    const resize = () => {
        size.x.max = Math.min(runtimeData.viewportSize.w, max.x)
        size.y.max = Math.min(runtimeData.viewportSize.h, max.y)

        runtimeData.maxOverscroll.x = size.x.max
        runtimeData.maxOverscroll.y = size.y.max
        
    }

    const wheel = (wheelDelta) => {
        
        if (wheelDelta >= 0) {
            // 上滚
            switch (runtimeData.overscroll.y) {
                case 'before':
                    // 顶部Hint内上滚, 重置
                    countdown.y.key += 1
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
                    countdown.y.key += 1
                    break
            }
        }
        // if(runtimeData.back){
        //     setTimeout(() => {
        //         runtimeData.back = false
        //     }, 300)
        // }
    }

    const resetCountdown = (scroll) => {
        // console.log('reset');

        countdown.y.key += 1
    }

    const countdownEnd = () => {
        // console.log('end', runtimeData.draging);

        if (runtimeData.draging) {
            countdown.y.run = false
            return
        }

        runtimeData.back = true
        
        switch (runtimeData.overscroll.y) {
            case 'before':
                runtimeData.scroll.y = 0
                break
            case 'after':
                runtimeData.scroll.y = runtimeData.maxScroll.y
                break
        }
        
        countdown.y.run = false
        // setTimeout(() => {
        //     runtimeData.back = false
        // }, 300)
    }
    const countdownStart = () => {
        // console.log('start');

        countdown.y.run = true
    }

    return {
        pullRatio,
        size,
        countdown,
        // hintX,
        // hintY,
        update,
        resize,
        wheel,
        resetCountdown,
        countdownEnd,
        countdownStart,
        // topHintStyle,
        // bottomHintStyle,
    }
}
