// release() 的手工断言单测（无框架）
// 运行: node test/release.test.mjs
import { strict as assert } from 'node:assert'
import release from '../lib/easy_scroll/release.js'

let passed = 0

function mkRuntime(scrollY, maxY, opts = {}) {
    return {
        draging: false,
        back: false,
        scroll: { x: 0, y: scrollY },
        maxScroll: { x: 0, y: maxY },
        countdown: { x: { run: false }, y: { run: false } },
        ...opts,
    }
}

// 1. 顶部过界（before）→ 归 0
let rt = mkRuntime(-120, 800)
assert.equal(release(rt), true)
assert.equal(rt.scroll.y, 0)
assert.equal(rt.back, true)
passed++

// 2. 底部过界（after）→ 归 maxScroll
rt = mkRuntime(900, 800)
assert.equal(release(rt), true)
assert.equal(rt.scroll.y, 800)
assert.equal(rt.back, true)
passed++

// 3. 合法区间内 → 位置不变，仅触发快速回弹标记
rt = mkRuntime(400, 800)
assert.equal(release(rt), true)
assert.equal(rt.scroll.y, 400)
assert.equal(rt.back, true)
passed++

// 4. 另一轴(x)倒计时挂起不影响 y 归位
rt = mkRuntime(-120, 800, { countdown: { x: { run: true }, y: { run: false } } })
assert.equal(release(rt), true)
assert.equal(rt.scroll.y, 0)
passed++

// 5. 拖动中 → 不打断，位置与 back 保持原样
rt = mkRuntime(-120, 800, { draging: true })
assert.equal(release(rt), false)
assert.equal(rt.scroll.y, -120)
assert.equal(rt.back, false)
passed++

// 6. 倒计时挂起仲裁中(y) → 保持过界位置，等待倒计时结束
rt = mkRuntime(-120, 800, { countdown: { x: { run: false }, y: { run: true } } })
assert.equal(release(rt), false)
assert.equal(rt.scroll.y, -120)
assert.equal(rt.back, false)
passed++

// 7. x 轴过界 → 显式 axis='x' 归位
rt = mkRuntime(0, 800, { scroll: { x: -60, y: 0 }, maxScroll: { x: 500, y: 800 } })
assert.equal(release(rt, 'x'), true)
assert.equal(rt.scroll.x, 0)
assert.equal(rt.back, true)
passed++

// 8. 默认轴为 y：只归位 y；x 过界保持（双轴场景需分别显式传轴）
rt = mkRuntime(-30, 800, { scroll: { x: -60, y: -30 }, maxScroll: { x: 500, y: 800 } })
assert.equal(release(rt), true)
assert.equal(rt.scroll.y, 0)
assert.equal(rt.scroll.x, -60)
passed++

// 9. x 轴倒计时挂起 → axis='x' 时保持
rt = mkRuntime(0, 800, {
    scroll: { x: -60, y: 0 },
    maxScroll: { x: 500, y: 800 },
    countdown: { x: { run: true }, y: { run: false } },
})
assert.equal(release(rt, 'x'), false)
assert.equal(rt.scroll.x, -60)
assert.equal(rt.back, false)
passed++

console.log(`release.test.mjs: ${passed} 个用例全部通过 ✔`)
