<script>
import { defineComponent, ref, reactive, inject, computed, onBeforeUnmount } from 'vue'
import { clamp } from './utils.js'

export default defineComponent({
    components: {},
    props: {
        // data:{
        //     type: Object,
        //     required: true
        // },
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

        const thumbClass = computed(()=>({
            y: {
                joytick: props.scrollJoy,
                dragging: runtimeData.draging,
                es_back_scroll: runtimeData.back,
            },
        }))
        // thumb 的视觉位置：夹紧在轨道两端内，过界(overscroll)不体现在 UI 上。
        // 仅 UI 层约束；thumbRect.y.pos(逻辑值) 保持原样，不影响拖动/回弹/摇杆逻辑。
        // 摇杆模式例外：pos 表示以轨道中心为原点的摇杆偏移量，本就允许正负。
        const displayPosY = computed(() => {
            const pos = ctrlScroll.thumbRect.y.pos
            if (props.scrollJoy) return pos
            return clamp(pos, 0, ctrlScroll.maxScrBarPos.y)
        })
        const thumbStyle = computed(()=>({
            y: {
                height: `${ctrlScroll.thumbRect.y.height}px`,
                transform: `translate(-50%, ${displayPosY.value}px)`,
            },
        }))
        return { runtimeData, ctrlScroll, thumbClass, thumbStyle }
    },
})
</script>

<template lang="pug">
Teleport(:to="teleport", defer, :disabled="teleport === 'body'")
    .es_scroll_bar.es_scroll_y(:ref="el=>ctrlScroll.scrollRef.y.box=el")
        slot(name="scroll_y", 
            :scrollRatio="ctrlScroll.scrollRatio",
            :sizeRatio="ctrlScroll.sizeRatio",
            :thumb="ctrlScroll.thumbRect.y",
            :onDrag="(e)=>ctrlScroll.track_down(e, 'y')"
        )        
            .es_track(track, @pointerdown="ctrlScroll.track_down($event, 'y')")
                .es_track_view
                .es_thumb.es_smooth_scroll(thumb, 
                    :class="thumbClass.y",
                    :style="thumbStyle.y"
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
                // margin-top: -50px;
                // margin-left: calc(100% * -0.5);
            }
        }
        .es_thumb_view {
            width: 100%;
            height: 100%;
        }
    }
}
</style>
