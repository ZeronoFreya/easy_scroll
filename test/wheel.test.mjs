// readWheel() 跨浏览器滚轮步进读取单测(无框架)
// 运行: node test/wheel.test.mjs
import { strict as assert } from 'node:assert'
import { readWheel } from '../lib/easy_scroll/utils.js'

let passed = 0
const t = (name, actual, expected) => {
    assert.deepEqual(actual, expected, name)
    passed++
}

// 1. Chromium/Safari: 有 wheelDeltaX/Y 时优先使用(自带行距换算, 上/左为正)
t('chromium wheelDelta', readWheel({ wheelDeltaY: -120, wheelDeltaX: 0 }), { x: 0, y: -120 })

// 2. Firefox(像素模式 deltaMode=0): 仅有 deltaX/Y, 取反(下/右为正 → 上/左为正)
t('ff pixel mode', readWheel({ deltaY: 100, deltaX: -50, deltaMode: 0 }), { x: 50, y: -100 })

// 3. Firefox(行模式 deltaMode=1): deltaY=3行 × 40px/行
t('ff line mode', readWheel({ deltaY: 3, deltaMode: 1 }), { x: 0, y: -120 })

// 4. 属性全部缺失 → 0, 不抛错
t('empty event', readWheel({}), { x: 0, y: 0 })

// 5. 单轴缺失: wheelDeltaX 缺失但 deltaX 可用
t('x fallback only', readWheel({ wheelDeltaY: 0, deltaX: 5, deltaMode: 0 }), { x: -5, y: 0 })

console.log(`wheel.test.mjs: ${passed} 个用例全部通过 ✔`)
