<script>
import { defineComponent, inject, computed, onMounted } from 'vue'
import { clamp } from './utils.js'

export default defineComponent({
    props: {
        // 该条负责的轴: 'x' 渲染在底部, 'y' 渲染在右侧
        scroll: {
            type: String,
            default: 'y',
            validator: (value) => ['x', 'y'].includes(value),
        },
        scrollJoy: Boolean,
        teleport: {
            type: String,
            default: 'body',
        },
    },
    setup(props) {
        const runtimeData = inject('runtimeData')
        const scrollCtrl = inject('scrollCtrl')
        const ctrlScroll = scrollCtrl.scroll

        const isY = props.scroll === 'y'
        // 挂载/卸载时同步自身 DOM 引用(track/thumb), 支持 v-if 动态显隐
        const setBox = (el) => {
            const ref = ctrlScroll.scrollRef[props.scroll]
            ref.box = el
            if (el) {
                ref.track = el.querySelector('[track]') ?? null
                ref.thumb = el.querySelector('[thumb]') ?? null
            } else {
                ref.track = null
                ref.thumb = null
            }
        }
        // 动态挂载(内容从可滚变为不可滚/反之)后确保尺寸与轨道状态就绪;
        // Teleport defer 内容在 mounted 之后才插入, 故再补一帧同步
        onMounted(() => {
            ctrlScroll.resize()
            requestAnimationFrame(() => ctrlScroll.resize())
        })

        const thumbClass = computed(() => ({
            joytick: props.scrollJoy,
            dragging: runtimeData.draging,
            es_back_scroll: runtimeData.back,
        }))

        // thumb 的视觉位置：夹紧在轨道两端内，过界(overscroll)不体现在 UI 上。
        // 仅 UI 层约束；thumbRect[axis].pos(逻辑值) 保持原样。
        // 摇杆模式除外：pos 表示以轨道中心为原点的摇杆偏移量，允许正负。
        const displayPos = computed(() => {
            const pos = ctrlScroll.thumbRect[props.scroll].pos
            if (props.scrollJoy) return pos
            return clamp(pos, 0, ctrlScroll.maxScrBarPos[props.scroll])
        })

        const thumbStyle = computed(() => {
            const t = ctrlScroll.thumbRect[props.scroll]
            const pos = displayPos.value
            if (isY) {
                return {
                    height: `${t.height}px`,
                    transform: `translate(-50%, ${pos}px)`,
                }
            }
            // x 轨摇杆使用固定宽度杆, 保证可拖动范围
            const width = props.scrollJoy ? 100 : t.width
            return {
                width: `${width}px`,
                transform: `translate(${pos}px, -50%)`,
            }
        })
        return { runtimeData, ctrlScroll, isY, setBox, thumbClass, thumbStyle }
    },
})
</script>

<template lang="pug">
Teleport(:to="teleport", defer, :disabled="teleport === 'body'")
    .es_scroll_bar(:class="isY ? 'es_scroll_y' : 'es_scroll_x'", :ref="setBox")
        slot(:name="`scroll_${$props.scroll}`", 
            :sizeRatio="ctrlScroll.sizeRatio",
            :thumb="ctrlScroll.thumbRect[$props.scroll]",
            :onDrag="(e)=>ctrlScroll.track_down(e, $props.scroll)"
        )        
            .es_track(track, @pointerdown="ctrlScroll.track_down($event, $props.scroll)")
                .es_track_view
                .es_thumb.es_smooth_scroll(thumb, 
                    :class="thumbClass",
                    :style="thumbStyle"
                )
                    .es_thumb_view    
</template>

<style lang="scss">
.es_scroll_bar {
    --scrollbar-thumb: #cbd5e1;
    --scrollbar-thumb-hover: #94a3b8;
    --scrollbar-thumb-active: #3b82f6;
    position: absolute;
    background: transparent;
    z-index: 2;
    .es_track {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .es_track_view {
        width: 100%;
        height: 100%;
        border-radius: 7px;
        background-color: transparent;
        transition: background-color 0.2s;
    }
    .es_thumb {
        will-change: transform;
        position: absolute;
        // transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        &.dragging {
            // transition: none;
            transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            .es_thumb_view {
                background-color: var(--scrollbar-thumb-active);
            }
        }
    }
    .es_thumb_view {
        pointer-events: none;
        // background: greenyellow;
        background-color: var(--scrollbar-thumb);
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    &:hover {
        .es_track_view {
            background-color: rgba(0, 0, 0, 0.03);
        }
        .es_thumb_view {
            background-color: var(--scrollbar-thumb-hover);
        }
    }

    // 纵向条（右侧）
    &.es_scroll_y {
        top: 0;
        right: 0;
        width: 20px;
        height: 100%;
        padding: 5px 0;
        .es_track {
            padding: 0 5px;
        }
        .es_thumb {
            width: 100%;
            height: 0px;
            top: 0;
            left: 50%;
            transform: translate(-50%, 0);
            padding: 0 5px;

            &.joytick {
                height: 100px;
                top: 50%;
            }
        }
        .es_thumb_view {
            width: 100%;
            height: 100%;
        }
    }

    // 横向条（底部）
    &.es_scroll_x {
        bottom: 0;
        left: 0;
        width: 100%;
        height: 20px;
        padding: 0 5px;
        .es_track {
            padding: 5px 0;
        }
        .es_thumb {
            width: 0px;
            height: 100%;
            top: 50%;
            left: 0;
            transform: translate(0, -50%);
            padding: 5px 0;

            &.joytick {
                width: 100px;
                left: 50%;
            }
        }
        .es_thumb_view {
            width: 100%;
            height: 100%;
        }
    }
}
</style>
