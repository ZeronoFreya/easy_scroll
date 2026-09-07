// use_overscroll() 的手工断言单测（无框架）
// 运行: node test/overscroll.test.mjs
import { strict as assert } from 'node:assert'
import useOverscroll from '../lib/easy_scroll/use_overscroll.js'

let passed = 0
const rt = {
    scroll: { x: 0, y: 0 },
    maxScroll: { x: 1000, y: 800 },
    overscroll: { x: '', y: '' },
    maxOverscroll: { x: 0, y: 0 },
}
const os = useOverscroll(rt)

// 1. 顶部过界 → before
rt.scroll.y = -50
os.update('y')
assert.equal(rt.overscroll.y, 'before')
passed++

// 2. 底部过界 → after
rt.scroll.y = 900
os.update('y')
assert.equal(rt.overscroll.y, 'after')
passed++

// 3. 合法区间内 → 清空
rt.scroll.y = 400
os.update('y')
assert.equal(rt.overscroll.y, '')
passed++

// 4. 恰好位于边界(==0 / ==max) → 非过界
rt.scroll.y = 0
os.update('y')
assert.equal(rt.overscroll.y, '')
rt.scroll.y = 800
os.update('y')
assert.equal(rt.overscroll.y, '')
passed++

// 5. applyLimit 注入上限
os.applyLimit({ x: 150, y: 200 })
assert.equal(rt.maxOverscroll.x, 150)
assert.equal(rt.maxOverscroll.y, 200)
passed++

console.log(`overscroll.test.mjs: ${passed} 个用例全部通过 ✔`)
