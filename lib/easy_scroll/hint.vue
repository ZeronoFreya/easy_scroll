<script>
import { defineComponent, ref, inject } from 'vue'

export default defineComponent({
    setup() {
        const hint = inject('hint')
        const runtimeData = inject('runtimeData')

        return { hint, runtimeData }
    },
})
</script>

<template lang="pug">
.es_scroll_hint.es_hint_top(
    :class="{ active: hint.pullRatio.y.before > 1.0 }", 
    :style="{ height: hint.size.y.before + 'px' }"
)
    .icon 🔄
    .text(v-if="runtimeData.draging") {{ hint.pullRatio.y.before > 1.0 ? '释放刷新' : '下拉刷新' }}
    .text(v-else) {{ hint.pullRatio.y.before > 1.0 ? 'A' : 'B' }}    
.es_scroll_hint.es_hint_bottom(
    :class="{ active: hint.pullRatio.y.after > 1.0 }", 
    :style="{height: hint.size.y.after + 'px'}"
)
    .icon 🔄
    .text {{ hint.pullRatio.y.after > 1.0 ? '释放加载' : '上拉加载' }}    
</template>

<style lang="scss">
.es_scroll_hint {
    position: absolute;
    left: 0;
    width: 100%;
    z-index: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 13px;
    pointer-events: none;
    opacity: 0.9;
    overflow: hidden;
    will-change: height;
    // transition: height 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    // will-change: transform;
    transition: height 1s cubic-bezier(0.23, 1, 0.32, 1);

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
