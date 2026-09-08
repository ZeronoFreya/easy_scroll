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
        maxScroll: { y: 1000 },
        overscroll: { y: '' },
    })

    const hint = useHint(runtimeData)

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

    // 5. update(): before/after 拉伸阈值必须对称 —— 拉伸 90px 应同样激活(>1.0)。
    //    回归: after_r 曾误写为 |scroll + maxScroll|/80, 长内容下任何过界都恒激活。
    assert.equal(hint.pullRatio.y.before, 0)
    assert.equal(hint.pullRatio.y.after, 0)

    runtimeData.overscroll.y = 'before'
    runtimeData.scroll.y = -90 // 顶部拉伸 90px
    hint.update('y')
    const rBefore = hint.pullRatio.y.before
    assert.ok(rBefore > 1.0, `before 拉伸 90px 应激活, 实际 ${rBefore}`)
    assert.equal(hint.size.y.before, 90)
    assert.equal(hint.pullRatio.y.after, 0) // 未过界方向保持 0

    runtimeData.overscroll.y = 'after'
    runtimeData.scroll.y = 1090 // 底部拉伸 90px (maxScroll=1000)
    hint.update('y')
    assert.ok(hint.pullRatio.y.after > 1.0, `after 拉伸 90px 应激活, 实际 ${hint.pullRatio.y.after}`)
    assert.equal(hint.size.y.after, 90)
    assert.equal(hint.pullRatio.y.after, rBefore) // 对称性: 同拉伸量阈值一致

    console.log('hint.test.mjs: 5 个用例全部通过 ✔')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
