// release() 的手工断言单测（无框架）
// 运行: node test/release.test.mjs
import { strict as assert } from 'node:assert'
import release from '../lib/easy_scroll/release.js'

let passed = 0

function mkRuntime(scrollY, maxY, opts = {}) {
    return {
        draging: false,
        back: false,
        scroll: { y: scrollY },
        maxScroll: { y: maxY },
        ...opts,
    }
}

const hintOff = null // showHint=false
const hintIdle = { countdown: { y: { run: false } } }
const hintCounting = { countdown: { y: { run: true } } }

// 1. 顶部过界（before）→ 归 0
let rt = mkRuntime(-120, 800)
assert.equal(release(rt, hintIdle), true)
assert.equal(rt.scroll.y, 0)
assert.equal(rt.back, true)
passed++

// 2. 底部过界（after）→ 归 maxScroll
rt = mkRuntime(900, 800)
assert.equal(release(rt, hintIdle), true)
assert.equal(rt.scroll.y, 800)
assert.equal(rt.back, true)
passed++

// 3. 合法区间内 → 位置不变，仅触发快速回弹标记
rt = mkRuntime(400, 800)
assert.equal(release(rt, hintIdle), true)
assert.equal(rt.scroll.y, 400)
assert.equal(rt.back, true)
passed++

// 4. hint 未启用（null）同样可用
rt = mkRuntime(-50, 800)
assert.equal(release(rt, hintOff), true)
assert.equal(rt.scroll.y, 0)
assert.equal(rt.back, true)
passed++

// 5. 拖动中 → 不打断，位置与 back 保持原样
rt = mkRuntime(-120, 800, { draging: true })
assert.equal(release(rt, hintIdle), false)
assert.equal(rt.scroll.y, -120)
assert.equal(rt.back, false)
passed++

// 6. hint 倒计时中 → 保持过界位置，等待倒计时结束
rt = mkRuntime(-120, 800)
assert.equal(release(rt, hintCounting), false)
assert.equal(rt.scroll.y, -120)
assert.equal(rt.back, false)
passed++

console.log(`release.test.mjs: ${passed} 个用例全部通过 ✔`)
