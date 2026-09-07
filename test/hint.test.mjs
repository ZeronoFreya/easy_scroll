// use_hint() 的"拖动开始自动重置倒计时 key"逻辑单测（无框架）
// 运行: node test/hint.test.mjs
import { reactive, nextTick } from 'vue'
import { strict as assert } from 'node:assert'
import useHint from '../lib/easy_scroll/use_hint.js'

async function main() {
    const runtimeData = reactive({
        draging: false,
        countdown: { x: { key: 0, run: false }, y: { key: 0, run: false } },
        scroll: { y: 0 },
        maxScroll: { y: 100 },
        overscroll: { y: '' },
    })

    useHint(runtimeData)

    // 1. 初始 key = 0
    assert.equal(runtimeData.countdown.y.key, 0)

    // 2. 拖动开始(false→true) → key 递增（重走进度动画）
    runtimeData.draging = true
    await nextTick()
    assert.equal(runtimeData.countdown.y.key, 1)

    // 3. 释放后再拖动 → 再次递增
    runtimeData.draging = false
    await nextTick()
    assert.equal(runtimeData.countdown.y.key, 1) // 释放不改 key
    runtimeData.draging = true
    await nextTick()
    assert.equal(runtimeData.countdown.y.key, 2)

    // 4. 保持拖动不重复递增（同值写入不触发）
    runtimeData.draging = true
    await nextTick()
    assert.equal(runtimeData.countdown.y.key, 2)

    console.log('hint.test.mjs: 4 个用例全部通过 ✔')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
