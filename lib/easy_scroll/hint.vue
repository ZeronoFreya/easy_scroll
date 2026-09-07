<script>
import { defineComponent, ref, inject, computed } from 'vue'

export default defineComponent({
    setup() {
        const hint = inject('hint')
        const runtimeData = inject('runtimeData')

        const displayHintX = computed(() => runtimeData.scroll.x.toFixed(2))
        const displayHintY = computed(() => runtimeData.scroll.y.toFixed(2))

        const styleY = computed(() => ({
            width: runtimeData.viewportSize.w + 'px',
            height: hint.size.y.max + 'px',
            transform: `translateX(${displayHintX.value}px)`,
        }))

        const mouseenter = () => {
            runtimeData.countdown.y.run = false
            hint.mouseInHint = true
        }

        const mouseleave = () => {
            hint.mouseInHint = false
            hint.countdownEnd()
        }

        return { hint, runtimeData, displayHintX, styleY, mouseenter, mouseleave }
    },
})
</script>

<template lang="pug">
.es_scroll_hint.es_hint_top(
    :class="{ active: hint.pullRatio.y.before > 1.0, es_back_hint: runtimeData.back }", 
    :style="[styleY, {top: `-${hint.size.y.max}px`}]",
    @mouseenter="mouseenter",
    @mouseleave="mouseleave",
)
    .es_countdown_bar(:class="{show: hint.size.y.before > 0}")
        .es_progress_fill(
            v-if="hint.size.y.before > 0",
            :key="runtimeData.countdown.y.key",
            :class="{ es_progress_run: runtimeData.countdown.y.run }",            
            @animationstart="hint.countdownStart",
            @animationend="hint.countdownEnd",
        )
    slot(name="hint_top")
        .es_hint_content
            .icon 🔄
            .text(v-if="runtimeData.draging") {{ hint.pullRatio.y.before > 1.0 ? '释放刷新' : '下拉刷新' }}
            .text(v-else) {{ hint.pullRatio.y.before > 1.0 ? 'A' : 'B' }}    
.es_scroll_hint.es_hint_bottom(
    :class="{ active: hint.pullRatio.y.after > 1.0, es_back_hint: runtimeData.back }", 
    :style="[styleY, {bottom: `-${hint.size.y.max}px`}]",
    @mouseenter="mouseenter",
    @mouseleave="mouseleave",
)
    .es_countdown_bar(:class="{show: hint.size.y.after > 0}")
        .es_progress_fill(
            v-if="hint.size.y.after > 0",
            :key="runtimeData.countdown.y.key",
            :class="{ es_progress_run: runtimeData.countdown.y.run }",            
            @animationstart="hint.countdownStart",
            @animationend="hint.countdownEnd",
        )
    slot(name="hint_bottom")
        .es_hint_content
            .icon 🔄
            .text(v-if="runtimeData.draging") {{ hint.pullRatio.y.after > 1.0 ? '释放加载' : '上拉加载' }}  
            .text(v-else) {{ hint.pullRatio.y.before > 1.0 ? 'A' : 'B' }}     
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

        color: #666;
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
        color: #3b82f6;
        opacity: 1;
        font-weight: bold;
    }

    &.es_hint_top {
        // width: 100%;
        background: linear-gradient(to bottom, #eff6ff, #fff);
        border-bottom: 1px solid rgba(59, 130, 246, 0.1);

        &.active .icon {
            transform: rotate(180deg) scale(1.2);
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
            background: #3b82f6;
            opacity: 0.6;
        }
    }

    &.es_hint_bottom {
        background: linear-gradient(to top, #eff6ff, #fff);
        border-top: 1px solid rgba(59, 130, 246, 0.1);
        &.active .icon {
            transform: rotate(-180deg) scale(1.2);
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
            background: #3b82f6;
            opacity: 0.6;
        }
    }
}
</style>
