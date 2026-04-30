<script>
import { defineComponent, ref, inject, computed } from 'vue'

export default defineComponent({
    setup() {
        const hint = inject('hint')
        const runtimeData = inject('runtimeData')     
        
        const isPaused = ref(false)

        const isPlaying = computed(()=>{
            return !isPaused.value && hint.pullRatio.y.before > 1.0
        })       

        return { hint, runtimeData, isPlaying, isPaused }
    },
})
</script>

<template lang="pug">
.es_scroll_hint.es_hint_top(
    :class="{ active: hint.pullRatio.y.before > 1.0 }", 
    :style="{ height: hint.size.y.before + 'px' }",
    @mouseenter="isPaused=true",
    @mouseleave="isPaused=false",
)
    .es_countdown_bar
        .es_progress_fill(
            :key="hint.countdown.y.key",
            :class="{ es_progress_run: isPlaying }",            
            @animationend="hint.countdownEnd"
        )
    slot(name="hint_top")
        .es_hint_content
            .icon 🔄
            .text(v-if="runtimeData.draging") {{ hint.pullRatio.y.before > 1.0 ? '释放刷新' : '下拉刷新' }}
            .text(v-else) {{ hint.pullRatio.y.before > 1.0 ? 'A' : 'B' }}    
.es_scroll_hint.es_hint_bottom(
    :class="{ active: hint.pullRatio.y.after > 1.0 }", 
    :style="{height: hint.size.y.after + 'px'}"
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
    width: 100%;
    z-index: 0;

    will-change: height;
    transition: height 1s cubic-bezier(0.23, 1, 0.32, 1);

    .es_countdown_bar {
        position: absolute;
        pointer-events: none;
    }
    .es_progress_fill {
        animation: shrink 2s linear forwards;
        animation-play-state: paused;
        &.es_progress_run {
            animation-play-state: running;
        }
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
        top: 0;
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
        bottom: 0;
        background: linear-gradient(to top, #eff6ff, #fff);
        border-top: 1px solid rgba(59, 130, 246, 0.1);
        &.active .icon {
            transform: rotate(-180deg) scale(1.2);
        }
    }
}
</style>
