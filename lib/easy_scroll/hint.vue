<script>
import { defineComponent, ref, inject, computed } from 'vue'

export default defineComponent({
    setup() {
        const hint = inject('hint')
        const runtimeData = inject('runtimeData')
        const scrollAxis = inject('scrollAxis', 'xy')

        const showXHint = computed(() => scrollAxis.includes('x'))

        const displayHintX = computed(() => runtimeData.scroll.x.toFixed(2))
        const displayHintY = computed(() => runtimeData.scroll.y.toFixed(2))

        // 纵向条带(上/下): 宽=视口宽, 高=过界上限; 水平随内容补偿
        const styleY = computed(() => ({
            width: runtimeData.viewportSize.w + 'px',
            height: hint.size.y.max + 'px',
            transform: `translateX(${displayHintX.value}px)`,
        }))

        // 横向条带(左/右): 宽=过界上限, 高=视口高; 垂直随内容补偿
        const styleX = computed(() => ({
            width: hint.size.x.max + 'px',
            height: runtimeData.viewportSize.h + 'px',
            transform: `translateY(${displayHintY.value}px)`,
        }))

        // 悬停面板: 冻结该轴倒计时并阻止自动回弹, 离开后触发归位
        const mouseenter = (axis) => {
            runtimeData.countdown[axis].run = false
            hint.mouseInHint[axis] = true
        }
        const mouseleave = (axis) => {
            hint.mouseInHint[axis] = false
            hint.countdownEnd(axis)
        }

        return { hint, runtimeData, styleY, styleX, showXHint, mouseenter, mouseleave }
    },
})
</script>

<template lang="pug">
.es_scroll_hint.es_hint_top(
    v-if="runtimeData.maxScroll.y > 0",
    :class="{ active: hint.pullRatio.y.before > 1.0, es_back_hint: runtimeData.back }", 
    :style="[styleY, {top: `-${hint.size.y.max}px`}]",
    @mouseenter="mouseenter('y')",
    @mouseleave="mouseleave('y')",
)
    .es_countdown_bar(:class="{show: hint.size.y.before > 0}")
        .es_progress_fill(
            v-if="hint.size.y.before > 0",
            :key="runtimeData.countdown.y.key",
            :class="{ es_progress_run: runtimeData.countdown.y.run }",            
            @animationstart="hint.countdownStart('y')",
            @animationend="hint.countdownEnd('y')",
        )
    slot(name="hint_top")
        .es_hint_content
            .icon 🔄
            .text(v-if="runtimeData.draging") {{ hint.pullRatio.y.before > 1.0 ? '释放刷新' : '下拉刷新' }}
            .text(v-else) 下拉刷新
.es_scroll_hint.es_hint_bottom(
    v-if="runtimeData.maxScroll.y > 0",
    :class="{ active: hint.pullRatio.y.after > 1.0, es_back_hint: runtimeData.back }", 
    :style="[styleY, {bottom: `-${hint.size.y.max}px`}]",
    @mouseenter="mouseenter('y')",
    @mouseleave="mouseleave('y')",
)
    .es_countdown_bar(:class="{show: hint.size.y.after > 0}")
        .es_progress_fill(
            v-if="hint.size.y.after > 0",
            :key="runtimeData.countdown.y.key",
            :class="{ es_progress_run: runtimeData.countdown.y.run }",            
            @animationstart="hint.countdownStart('y')",
            @animationend="hint.countdownEnd('y')",
        )
    slot(name="hint_bottom")
        .es_hint_content
            .icon 🔄
            .text(v-if="runtimeData.draging") {{ hint.pullRatio.y.after > 1.0 ? '释放加载' : '上拉加载' }}
            .text(v-else) 上拉加载
.es_scroll_hint.es_hint_left(
    v-if="showXHint && runtimeData.maxScroll.x > 0",
    :class="{ active: hint.pullRatio.x.before > 1.0, es_back_hint: runtimeData.back }", 
    :style="[styleX, {left: `-${hint.size.x.max}px`, top: '0'}]",
    @mouseenter="mouseenter('x')",
    @mouseleave="mouseleave('x')",
)
    .es_countdown_bar(:class="{show: hint.size.x.before > 0}")
        .es_progress_fill(
            v-if="hint.size.x.before > 0",
            :key="runtimeData.countdown.x.key",
            :class="{ es_progress_run: runtimeData.countdown.x.run }",            
            @animationstart="hint.countdownStart('x')",
            @animationend="hint.countdownEnd('x')",
        )
    slot(name="hint_left")
        .es_hint_content
            .icon ◀
            .text(v-if="runtimeData.draging") {{ hint.pullRatio.x.before > 1.0 ? '到头了' : '向左拖' }}
            .text(v-else) 已到最左
.es_scroll_hint.es_hint_right(
    v-if="showXHint && runtimeData.maxScroll.x > 0",
    :class="{ active: hint.pullRatio.x.after > 1.0, es_back_hint: runtimeData.back }", 
    :style="[styleX, {right: `-${hint.size.x.max}px`, left: 'auto', top: '0'}]",
    @mouseenter="mouseenter('x')",
    @mouseleave="mouseleave('x')",
)
    .es_countdown_bar(:class="{show: hint.size.x.after > 0}")
        .es_progress_fill(
            v-if="hint.size.x.after > 0",
            :key="runtimeData.countdown.x.key",
            :class="{ es_progress_run: runtimeData.countdown.x.run }",            
            @animationstart="hint.countdownStart('x')",
            @animationend="hint.countdownEnd('x')",
        )
    slot(name="hint_right")
        .es_hint_content
            .icon ▶
            .text(v-if="runtimeData.draging") {{ hint.pullRatio.x.after > 1.0 ? '到头了' : '向右拖' }}
            .text(v-else) 已到最右
</template>

<style lang="scss">

@keyframes shrink {
    from {
        width: 100%;
    }
    to {
        width: 0%;
    }
}

.es_scroll_hint {
    position: absolute;
    left: 0;
    width: 0;
    height: 0;
    z-index: 0;
    opacity: 1;
    will-change: height;
    transition: height 1.6s cubic-bezier(0.23, 1, 0.32, 1);
    &.es_back_hint {
        transition: height 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .es_countdown_bar {
        position: absolute;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.6s;
        &.show {
            opacity: 1;
            .es_progress_run {
                animation-play-state: running;
            }
        }
    }
    .es_progress_fill {
        animation: shrink 2s linear forwards;
        animation-play-state: paused;
        // &.es_progress_run {
        //     animation-play-state: running;
        // }
    }

    .es_hint_content {
        width: 100%;
        height: 100%;
        position: relative;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        color: var(--es-text-secondary);
        font-size: 13px;
        pointer-events: none;
        opacity: 0.9;
        overflow: hidden;
    }

    .icon {
        font-size: 24px;
        margin-bottom: 4px;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    &.active {
        color: var(--es-accent);
        opacity: 1;
        font-weight: bold;
    }

    &.es_hint_top {
        max-width: 100%;
        background: linear-gradient(to bottom, var(--es-hint-start), var(--es-hint-end));
        border-bottom: 1px solid var(--es-hint-border);

        &.active .icon {
            transform: rotate(180deg) scale(1.2);
        }

        .es_countdown_bar {
            bottom: 0;
            left: 0;
            width: 100%;
            height: fit-content;
            padding: 5px;
        }
        .es_progress_fill {
            width: 100%;
            height: 3px;
            border-radius: 3px;
            background: var(--es-accent);
            opacity: 0.6;
        }
    }

    &.es_hint_bottom {
        max-width: 100%;
        background: linear-gradient(to top, var(--es-hint-start), var(--es-hint-end));
        border-top: 1px solid var(--es-hint-border);
        &.active .icon {
            transform: rotate(-180deg) scale(1.2);
        }

        .es_countdown_bar {
            top: 0;
            left: 0;
            width: 100%;
            height: fit-content;
            padding: 5px;
        }
        .es_progress_fill {
            width: 100%;
            height: 3px;
            border-radius: 3px;
            background: var(--es-accent);
            opacity: 0.6;
        }
    }

    // 横向条带(左/右): 宽 = size.x.max, 高 = 视口高, 垂直随内容补偿
    &.es_hint_left {
        max-height: 100%;
        background: linear-gradient(to right, var(--es-hint-start), var(--es-hint-end));
        border-right: 1px solid var(--es-hint-border);

        &.active .icon {
            transform: scale(1.3);
        }
    }

    // right 定位需解除基类 left:0（否则 width 固定时 left 优先、right 被忽略）
    &.es_hint_right {
        max-height: 100%;
        left: auto;
        background: linear-gradient(to left, var(--es-hint-start), var(--es-hint-end));
        border-left: 1px solid var(--es-hint-border);

        &.active .icon {
            transform: scale(1.3);
        }
    }

    // 左右面板的倒计时进度条: 放在面板内侧边缘的竖条, 由下(外)向上(内)缩短
    &.es_hint_left .es_countdown_bar {
        top: 0;
        right: 0;
        width: fit-content;
        height: 100%;
        padding: 5px;
    }
    &.es_hint_right .es_countdown_bar {
        top: 0;
        left: 0;
        width: fit-content;
        height: 100%;
        padding: 5px;
    }

    &.es_hint_left .es_progress_fill,
    &.es_hint_right .es_progress_fill {
        width: 3px;
        height: 100%;
        border-radius: 3px;
        background: var(--es-accent);
        opacity: 0.6;
    }
    // 纵向进度由下(外)向上(内)收缩: 用 height 动画
    &.es_hint_left .es_progress_fill {
        animation-name: shrink-h;
        bottom: 0;
    }
    &.es_hint_right .es_progress_fill {
        animation-name: shrink-h;
        bottom: 0;
    }
}

@keyframes shrink-h {
    from {
        height: 100%;
    }
    to {
        height: 0%;
    }
}
</style>
