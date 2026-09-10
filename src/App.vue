<script>
import { ref } from 'vue'

import EasyScroll from '../lib/easy_scroll/index.vue'

export default {
    components: { EasyScroll },
    setup() {
        const theme = ref('light')
        const toggleTheme = () => {
            theme.value = theme.value === 'light' ? 'dark' : 'light'
        }
        return { theme, toggleTheme }
    },
}
</script>

<template lang="pug">
div.page(:data-es-theme="theme")
    .toolbar
        span.label theme: {{ theme }}
        button(@click="toggleTheme") {{ theme === 'light' ? '切换到深色' : '切换到亮色' }}
    .flex
        div
            EasyScroll.easy_scroll(
                scrollAxis="y",
                :midMouseNav="true",
                :scrollBar="true",
                scrollJoy="a",
                :showHint="true",
                autoSize="a",
                scrollReverse="a",
                offsetScrollY="80%",
                :theme="theme",
            )
                ul.ul1
                    li(v-for="i in 25" :key="i") 列表项 - {{ i }}
        div
            EasyScroll.easy_scroll(
                scrollAxis="y",
                :midMouseNav="true",
                :scrollBar="true",
                scrollJoy="",
                :scrollAutoHide="true",
                :showHint="true",
                offsetScrollY="120%",
                autoSize="y",
                :theme="theme",
            )
                ul.ul1
                    li(v-for="i in 25" :key="i") auto-hide - {{ i }}
        div
            EasyScroll.easy_scroll(
                scrollAxis="y",
                :midMouseNav="true",
                :scrollBar="true",
                scrollJoy="a",
                :showHint="true",
                autoSize="y",
                :theme="theme",
            )
                ul.ul1
                    li(v-for="i in 5" :key="i") 列表项 - {{ i }}
    h1
    EasyScroll.easy_scroll2(
        scrollAxis="x",
        :midMouseNav="true",
        :scrollBar="true",
        scrollJoy="",
        :showHint="true",
        scrollReverse="a",
        :theme="theme",
    )
        ul.ul2
            li(v-for="i in 50" :key="i") 列表项 - {{ i }}
</template>

<style lang="scss">
.page {
    min-height: 100vh;
    padding: 30px;
    background: var(--es-page-bg);
    --es-page-bg: #f3f4f6;
    &[data-es-theme='dark'] {
        --es-page-bg: #0f1115;
    }

}
.flex{
    display: flex;
    gap: 30px;
}
.easy_scroll{
    width: 30vw;
    max-height: 60vh;
    // background: red;
    // padding: 15px;
}
.easy_scroll2{
    width: 60vw;
    height: 10vh;
    background: red;
    // padding: 15px;
}
.toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    color: var(--es-txt, #333);
}
.page[data-es-theme='dark'] .toolbar {
    --es-txt: #e5e7eb;
}
.ul1{
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: gold;
    padding: 0;
}
.ul2{
    display: flex;
    height: 100%;
    gap: 12px;
    background-color: gold;
    padding: 0;
}
li {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(128, 128, 128, 0.2);
    font-size: 16px;
    white-space: nowrap;
    background-color: #b2cfff;
}
</style>
