<script>
import { ref,  onMounted } from 'vue'

import EasyScroll from '../lib/easy_scroll/index.vue'

export default {
    components: { EasyScroll },
    setup() {
        return {}
    },
}
</script>

<template lang="pug">
EasyScroll(:midMouseNav="true", :scrollJoy="!true", :showHint="true")
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
    
    .track{
        width: 100%;
        height: 100%;
        background: blue;
    }
    .thumb{
        width: 100%;
        // height: 30px;
        background: red;
    }
}
</style>
