<script>
import { defineComponent, ref, onBeforeUnmount } from 'vue'

export default defineComponent({
    components: {},
    props: {
        data:{
            type: Object,
            required: true
        },
        scroll: {
            type: String,
            default: 'y',
            validator: (value) => ['x', 'y'].includes(value),
        },        
        teleport: {
            type: String,
            default: 'body',
        },
    },
    setup(props) {
        let math_temp = 0
        let thumb_mouse_offset = 0

        const thumbRef = ref(null)

        const track_up = (e) => {
            // const scroll = e.currentTarget.dataset.scroll
            const track = e.currentTarget
            track.classList.remove('es_track_down')
            math_temp = 0
            thumb_mouse_offset = 0
            track.removeEventListener('pointermove', track_move)
            track.removeEventListener('pointerup', track_up)

            // resetTime(scroll)
        }

        const track_move = (e) => {
            const offset = (props.scroll == 'x' ? e.offsetX : e.offsetY) - thumb_mouse_offset
            // scroll_to(scroll, Math.round(offset * math_temp))
        }

        const track_down = (e) => {
            const track = e.currentTarget
            track.classList.add('es_track_down')
            // const scroll = props.scroll
            const offsetSize = props.scroll == 'x' ? 'offsetWidth' : 'offsetHeight'
            // const scrollPos = scroll == 'x' ? 'scrollLeft' : 'scrollTop'
            let offset = props.scroll == 'x' ? e.offsetX : e.offsetY
            // math_temp = refEl.scroll_content[offsetSize] / track[offsetSize]

            if (e.target === thumbRef.value) {
                // 拖拽 thumb: 使用点击的位置
                thumb_mouse_offset = offset
            } else {
                // 在 track 拖拽: 使用 thumb 的中心
                thumb_mouse_offset = thumbRef.value[offsetSize] / 2
                offset -= thumb_mouse_offset
                // refEl.scroll_box[scrollPos] = Math.round(offset * math_temp)
            }

            track.addEventListener('pointerup', track_up)
            track.addEventListener('pointermove', track_move)
            track.setPointerCapture(e.pointerId)
        }
        // onBeforeUnmount(track_up)
        return { track_down, thumbRef }
    },
})
</script>

<template lang="pug">
Teleport(:to="teleport", defer, :disabled="teleport === 'body'")
    slot(:title="'title'")
        .es_scroll_bar(:class="['es_scroll_'+scroll]")
            .es_track(@pointerdown.stop="track_down")
                .es_track_view
                .es_thumb(ref="thumbRef")
                    .es_thumb_view    
</template>

<style lang="scss">
.es_scroll_bar {
    position: absolute;
    background: goldenrod;
    z-index: 2;
    .es_track {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .es_track_view {
        width: 100%;
        height: 100%;
        background: red;
    }
    .es_thumb {
        position: absolute;

        width: 100%;
        height: 100%;
    }
    .es_thumb_view {
        background: greenyellow;
    }
    &.es_scroll_y {
        top: 0;
        right: 0;
        width: 30px;
        height: 100%;
        .es_track {
            padding: 0 5px;
        }
        .es_thumb {
            top: 0;
            left: 50%;
            transform: translate(-50%, 0);
            padding: 0 5px;
        }
        .es_thumb_view {
            width: 100%;
            height: 100px;
        }
    }
}
</style>
