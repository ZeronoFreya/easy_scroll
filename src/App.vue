<script>
import { ref, onMounted } from 'vue'

import EasyScroll from '../lib/easy_scroll/index.vue'

export default {
    components: { EasyScroll },
    setup() {
        return {}
    },
}
</script>

<template lang="pug">
EasyScroll(:midMouseNav="true", :scrollBar="true", :scrollJoy="true", :showHint="true")
    li(v-for="i in 50" :key="i") 列表项 - {{ i }}
    //- template(#hint_top="slotProps")
    //-     .xxx {{slotProps}}
    //- template(#scroll_y="slotProps")
    //-     .div
    //-         .track(track, @pointerdown="slotProps.onDrag")
    //-             .thumb(thumb, :style="{height: `${slotProps.thumb.height}px`, transform: `translateY(${slotProps.thumb.top}px)`}")
</template>

<style lang="scss">
#app {
    // background: #2f3130;
    padding: 30px;
}
.div {
    position: fixed;
    top: 100px;
    left: 50vw;
    width: 30px;
    height: 300px;

    .track {
        width: 100%;
        height: 100%;
        background: blue;
    }
    .thumb {
        width: 100%;
        // height: 30px;
        background: red;
    }
}
li {
    width: fit-content;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #f0f0f0;
    color: #333;
    font-size: 16px;
    white-space: nowrap;
    background-color: #b2cfff;
}
</style>
