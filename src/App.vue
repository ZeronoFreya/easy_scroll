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
EasyScroll
</template>

<style lang="scss">
#app {
    // background: #2f3130;
    padding: 30px;
}
</style>
