// auto_hide.js 的手工断言单测（无框架）
// 运行: node test/auto_hide.test.mjs
import { strict as assert } from 'node:assert'
import { calcScrollBarVisible } from '../lib/easy_scroll/auto_hide.js'

let passed = 0

// 1. 未开启 autoHide: 恒可见(与 hover/拖动无关)
assert.equal(calcScrollBarVisible(false, false, false), true)
assert.equal(calcScrollBarVisible(false, true, false), true)
assert.equal(calcScrollBarVisible(false, false, true), true)
passed++

// 2. autoHide + 无任何 hover/拖动: 隐藏
assert.equal(calcScrollBarVisible(true, false, false), false)
passed++

// 3. autoHide + 滚动区域 hover: 可见
assert.equal(calcScrollBarVisible(true, false, true), true)
passed++

// 4. autoHide + 拖动中(即使指针移出滚动区): 保持可见
assert.equal(calcScrollBarVisible(true, true, false), true)
assert.equal(calcScrollBarVisible(true, true, true), true)
passed++

console.log(`auto_hide.test.mjs: ${passed} 个用例全部通过 ✔`)
