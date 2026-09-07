// 滚动条 / 摇杆（y 轴支持摇杆模式；x 轴恒为普通拖动模式）
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { clamp, safeDivide } from './utils.js'
import release from './release.js'

export default function useScrollbar(runtimeData, signal, joyStickMode) {
    // 当前拖动的轴与指针起始位置（axis 化：x 用 clientX/offsetWidth，y 用 clientY/offsetHeight）
    let activeScroll = 'y'
    let itemStart = 0

    let activeTrack = null
    let activeThumb = null

    const active = ref(false)
    // const back = ref(false)

    const joyMode = joyStickMode

    const scrollRef = reactive({
        x: {
            box: null,
            track: null,
            thumb: null,
        },
        y: {
            box: null,
            track: null,
            thumb: null,
        },
    })

    // 灵敏度（摇杆/速度模式）
    const sensitivity = ref(0.05)

    const maxScrBarPos = {
        x: 0,
        y: 0,
    }

    const maxScrRatio = reactive({
        x: 0, // maxScroll.x / maxScrBarPos.x
        y: 0, // maxScroll.y / maxScrBarPos.y
    })

    const thumbRect = reactive({
        x: {
            pos: 0,
            width: 0,
            height: 0,
        },
        y: {
            pos: 0,
            width: 0,
            height: 0,
        },
    })

    // 摇杆持续施力循环（仅 y 轨，scrollJoy 暂不支持 x）
    let loopContinue = false
    const myLoop = () => {
        const { y } = runtimeData.maxOverscroll

        runtimeData.scroll.y = clamp(
            runtimeData.scroll.y + thumbRect.y.pos * sensitivity.value,
            -y,
            runtimeData.maxScroll.y + y,
        )

        if (loopContinue) {
            runtimeData.rafId = requestAnimationFrame(myLoop)
        }
    }

    const updateScrollPos = (scroll) => {
        if (joyStickMode || runtimeData.currCtrlType == 'scrollbar') return
        thumbRect[scroll].pos = maxScrBarPos[scroll] * runtimeData.progress[scroll]
    }

    const updateScrollBar = () => {
        if (scrollRef.x.thumb) {
            const w = scrollRef.x.track.offsetWidth
            thumbRect.x.width = Math.round(w * runtimeData.sizeRatio.x)
            maxScrBarPos.x = Math.ceil(w - thumbRect.x.width)
            maxScrRatio.x = safeDivide(runtimeData.maxScroll.x, maxScrBarPos.x)
        }
        if (scrollRef.y.thumb) {
            const h = scrollRef.y.track.offsetHeight
            thumbRect.y.height = Math.round(h * runtimeData.sizeRatio.y)
            maxScrBarPos.y = Math.ceil(h - thumbRect.y.height)
            maxScrRatio.y = safeDivide(runtimeData.maxScroll.y, maxScrBarPos.y)

            if (joyStickMode) {
                scrollRef.y.thumb.style.marginTop = `-${Math.round(scrollRef.y.thumb.offsetHeight * 0.5)}px`
            }
        }
    }

    const init = () => {
        const trackX = scrollRef.x.box?.querySelector('[track]') ?? null
        const trackY = scrollRef.y.box?.querySelector('[track]') ?? null
        scrollRef.x.track = trackX
        scrollRef.y.track = trackY

        const thumbX = scrollRef.x.box?.querySelector('[thumb]') ?? null
        const thumbY = scrollRef.y.box?.querySelector('[thumb]') ?? null
        scrollRef.x.thumb = thumbX
        scrollRef.y.thumb = thumbY

        // 摇杆(仅 y)需要 track/thumb 定位上下文
        if (joyStickMode && trackY) {
            if (getComputedStyle(trackY).position === 'static') {
                trackY.style.position = 'relative'
            }
            if (thumbY) {
                if (getComputedStyle(thumbY).position === 'static') {
                    thumbY.style.position = 'absolute'
                }
                thumbY.style.top = '50%'
            }
        }

        updateScrollBar()
    }

    const track_up = (e) => {
        loopContinue = false
        runtimeData.currCtrlType = ''
        runtimeData.draging = false

        if (joyStickMode && activeScroll === 'y') {
            thumbRect.y.pos = 0
        }

        activeTrack.releasePointerCapture(e.pointerId)
        activeTrack.removeEventListener('pointermove', track_move)
        activeTrack.removeEventListener('pointerup', track_up)

        activeThumb = null
        activeTrack = null

        active.value = false

        // 释放后统一归位决策：按当前拖动轴，倒计时中保持，否则快速回弹
        release(runtimeData, activeScroll)
        activeScroll = 'y'
    }

    // 当前轴允许 thumb 超出合法区的最远距离(表达过界拉伸)
    const calcMaxPos = () => {
        const isX = activeScroll === 'x'
        const isJoy = joyStickMode && !isX
        if (isJoy) {
            return maxScrBarPos.y * 0.5
        }
        const over = isX ? runtimeData.maxOverscroll.x : runtimeData.maxOverscroll.y
        const ratio = isX ? runtimeData.sizeRatio.x : runtimeData.sizeRatio.y
        return over * ratio
    }

    const track_move = (e) => {
        if (runtimeData.currCtrlType != 'scrollbar') return
        const isX = activeScroll === 'x'
        const isJoy = joyStickMode && activeScroll === 'y'
        const clientPos = isX ? e.clientX : e.clientY

        if (isJoy) {
            thumbRect.y.pos = clamp(clientPos - itemStart, -calcMaxPos(), calcMaxPos())
            return
        }

        thumbRect[activeScroll].pos = clamp(
            clientPos - itemStart,
            -calcMaxPos(),
            maxScrBarPos[activeScroll] + calcMaxPos(),
        )

        const over = isX ? runtimeData.maxOverscroll.x : runtimeData.maxOverscroll.y
        runtimeData.scroll[activeScroll] = clamp(
            thumbRect[activeScroll].pos * maxScrRatio[activeScroll],
            -over,
            runtimeData.maxScroll[activeScroll] + over,
        )
    }

    const track_down = (e, scroll) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.button !== 0 || runtimeData.currCtrlType == 'midnav') return

        activeScroll = scroll
        activeTrack = e.currentTarget
        activeThumb = scrollRef[scroll].thumb
        if (!activeThumb) return

        const isX = scroll === 'x'
        const isJoy = joyStickMode && scroll === 'y'
        const clientPos = isX ? e.clientX : e.clientY
        const offsetSize = isX ? 'offsetWidth' : 'offsetHeight'

        if (isJoy) {
            if (e.target !== activeThumb) return
            itemStart = clientPos
        } else {
            active.value = true

            if (e.target === activeThumb) {
                // 拖拽 thumb: 记录起始差值，保持跟手
                itemStart = clientPos - thumbRect[scroll].pos
            } else {
                // 点击轨道: thumb 直接跳到点击处(以 thumb 尺寸中心对齐)
                thumbRect[scroll].pos =
                    (isX ? e.offsetX : e.offsetY) - activeThumb[offsetSize] * 0.5
                itemStart = clientPos - thumbRect[scroll].pos
            }
        }

        runtimeData.currCtrlType = 'scrollbar'
        runtimeData.draging = true

        if (isJoy) {
            loopContinue = true
            runtimeData.rafId = requestAnimationFrame(myLoop)
        } else {
            const over = isX ? runtimeData.maxOverscroll.x : runtimeData.maxOverscroll.y
            runtimeData.scroll[scroll] = clamp(
                thumbRect[scroll].pos * maxScrRatio[scroll],
                -over,
                runtimeData.maxScroll[scroll] + over,
            )
        }

        activeTrack.addEventListener('pointerup', track_up, { signal })
        activeTrack.addEventListener('pointermove', track_move, { signal })
        activeTrack.setPointerCapture(e.pointerId)
    }

    const resize = () => {
        updateScrollBar()
    }

    // onBeforeUnmount(() => {
    //     controller.abort()
    // })

    return {
        active,
        // back,
        scrollRef,
        joyMode,
        sensitivity,
        thumbRect,
        maxScrRatio,
        maxScrBarPos,
        init,
        track_down,
        resize,
        updateScrollPos,
    }
}
