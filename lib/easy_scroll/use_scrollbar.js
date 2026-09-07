// 滚动条 / 摇杆（x/y 双轨均支持摇杆模式；scrollJoy=false 时为普通拖动模式）
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
    // 当前被拖动的轴(响应式, 供 UI 判断只高亮该轴滚动条)
    const activeAxis = ref('')

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

    // 摇杆持续施力循环: 任一轨拖动时按各自偏离中心的位移施加速度
    // (未拖动轴 pos=0, 不产生位移)
    let loopContinue = false
    const myLoop = () => {
        const { x: moX, y: moY } = runtimeData.maxOverscroll

        runtimeData.scroll.x = clamp(
            runtimeData.scroll.x + thumbRect.x.pos * sensitivity.value,
            -moX,
            runtimeData.maxScroll.x + moX,
        )
        runtimeData.scroll.y = clamp(
            runtimeData.scroll.y + thumbRect.y.pos * sensitivity.value,
            -moY,
            runtimeData.maxScroll.y + moY,
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

            if (joyStickMode) {
                // 摇杆杆固定宽 100px(见 scrollbar.vue), 以轨道中心为原点居中
                scrollRef.x.thumb.style.marginLeft = '-50px'
            }
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

        // 摇杆模式需要 track/thumb 定位上下文(thumb 以轨道中心为原点)
        if (joyStickMode) {
            if (trackY) {
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
            if (trackX) {
                if (getComputedStyle(trackX).position === 'static') {
                    trackX.style.position = 'relative'
                }
                if (thumbX) {
                    if (getComputedStyle(thumbX).position === 'static') {
                        thumbX.style.position = 'absolute'
                    }
                    thumbX.style.left = '50%'
                }
            }
        }

        updateScrollBar()
    }

    const track_up = (e) => {
        loopContinue = false
        runtimeData.currCtrlType = ''
        runtimeData.draging = false

        if (joyStickMode) {
            // 摇杆回中(按当前拖动轴)
            thumbRect[activeScroll].pos = 0
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
        activeAxis.value = ''
    }

    // 当前轴允许 thumb 超出合法区的最远距离
    // (摇杆: 以中心为原点的最大偏移 = 轨道可移动量一半; 普通拖动: 过界拉伸量折算)
    const calcMaxPos = () => {
        const isX = activeScroll === 'x'
        if (joyStickMode) {
            return (isX ? maxScrBarPos.x : maxScrBarPos.y) * 0.5
        }
        const over = isX ? runtimeData.maxOverscroll.x : runtimeData.maxOverscroll.y
        const ratio = isX ? runtimeData.sizeRatio.x : runtimeData.sizeRatio.y
        return over * ratio
    }

    const track_move = (e) => {
        if (runtimeData.currCtrlType != 'scrollbar') return
        const isX = activeScroll === 'x'
        const clientPos = isX ? e.clientX : e.clientY

        if (joyStickMode) {
            // 摇杆: 位置 = 偏离中心的位移, 决定滚动速度
            thumbRect[activeScroll].pos = clamp(
                clientPos - itemStart,
                -calcMaxPos(),
                calcMaxPos(),
            )
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

        activeAxis.value = scroll

        const isX = scroll === 'x'
        const clientPos = isX ? e.clientX : e.clientY
        const offsetSize = isX ? 'offsetWidth' : 'offsetHeight'

        if (joyStickMode) {
            // 摇杆模式: 只能抓 thumb, 从中心位置开始计偏移
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

        if (joyStickMode) {
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

    // 摇杆拖动激活中被移除时兜底: 停循环并取消 rAF
    onBeforeUnmount(() => {
        loopContinue = false
        cancelAnimationFrame(runtimeData.rafId)
    })

    return {
        active,
        activeAxis,
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
