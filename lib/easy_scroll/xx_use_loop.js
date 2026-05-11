import { ref, computed } from 'vue'
import { clamp, safeDivide } from './utils.js'

export default function useLoop(runtimeData, scrollCtrl, hint) {
    const config = {
        maxDistance: 70,
        friction: 0.95,
        stopThreshold: 0.05, // 速度小于此值停止
        positionSnapThreshold: 0.2, // 位置偏差小于此值吸附
        pullThreshold: 80,
    }

    // 弹簧硬度, 越大可拉伸距离(过界)越短
    const springStiffness = ref(0.1)
    // 弹簧阻尼, 越大回弹越激烈
    const springDamping = ref(0.9)
    // 弹簧撞墙回弹, 越大回弹越激烈
    const wallRestitution = ref(0.6)

    // 滚轮回弹强度, 越大回弹越激烈
    const wheelRestitution = ref(0.4)
    // 滚轮最大拉伸范围
    const wheelMaxOverScroll = ref(200)

    const aa = ()=>{
        let displacement = 0
        runtimeData.isOverscrolling = false
        // 检查过界        
        if (runtimeData.scroll.y > 0) {
            // 顶部过界
            displacement = runtimeData.scroll.y
            runtimeData.isOverscrolling = true
            if (hint) {
                hint.topPullRatio = runtimeData.scroll.y / config.pullThreshold                
            }
        } else if (runtimeData.scroll.y < -runtimeData.maxScroll.y) {
            // 底部过界
            displacement = runtimeData.scroll.y + runtimeData.maxScroll.y
            runtimeData.isOverscrolling = true
            if (hint) {
                hint.bottomPullRatio = Math.abs(displacement) / config.pullThreshold
            }
        } else if (hint) {
            // 非过界，隐藏过界提示
            hint.topPullRatio = 0
            hint.bottomPullRatio = 0
        }

        
        return displacement
    }


    const physicsLoop = () => {
        let activeInputY = 0
        let isControlActive = false

        
        if (runtimeData.currCtrlType == 'scrollbar') {
            // 滚动条控制
            activeInputY = scrollCtrl.scroll.thumbRect.y.pos
            isControlActive = true
            // scrollCtrl.wheel.cancelTimer()

            if (scrollCtrl.scroll.joyMode) {
                // 摇杆模式
                runtimeData.velocity = -activeInputY * scrollCtrl.scroll.sensitivity
            } else {
                // 正常滚动条
                let targetScrollY = activeInputY * scrollCtrl.scroll.maxScrRatio.y
                
                runtimeData.velocity = 0
                runtimeData.scroll.y = -targetScrollY
                aa()
                runtimeData.rafId = requestAnimationFrame(physicsLoop)
                return
            }
        } else if (runtimeData.currCtrlType == 'midnav') {
            // 鼠标中键导航
            activeInputY = scrollCtrl.midnav.virtualPos.y
            isControlActive = true

            // scrollCtrl.wheel.cancelTimer()

            runtimeData.velocity = -activeInputY * scrollCtrl.midnav.sensitivity
        } else {
            // 滚轮
            if (Math.abs(runtimeData.velocity) < config.stopThreshold) {
                runtimeData.velocity = 0
            } else {
                runtimeData.velocity *= config.friction
            }
        }

        let displacement = aa()
        // runtimeData.isOverscrolling = false
        // // 检查过界
        // console.log(runtimeData.scroll.y);
        
        // if (runtimeData.scroll.y > 0) {
        //     // 顶部过界
        //     displacement = runtimeData.scroll.y
        //     runtimeData.isOverscrolling = true
        //     if (hint) {
        //         hint.topPullRatio = runtimeData.scroll.y / config.pullThreshold
        //         // console.log(hint.topPullRatio);
                
        //     }
        // } else if (runtimeData.scroll.y < -runtimeData.maxScroll.y) {
        //     // 底部过界
        //     displacement = runtimeData.scroll.y + runtimeData.maxScroll.y
        //     runtimeData.isOverscrolling = true
        //     if (hint) {
        //         hint.bottomPullRatio = Math.abs(displacement) / config.pullThreshold
        //     }
        // } else if (hint) {
        //     // 非过界，隐藏过界提示
        //     hint.topPullRatio = 0
        //     hint.bottomPullRatio = 0
        // }

        

        // 物理计算：弹簧力与悬停
        if (displacement !== 0) {
            let springForce = -displacement * springStiffness.value
            runtimeData.velocity += springForce
            runtimeData.velocity *= springDamping.value

            // 接近静止时，快速归位
            // if (Math.abs(runtimeData.velocity) < 0.2 && Math.abs(displacement) < 0.2) {
            if (Math.abs(displacement) < 0.2) {
                runtimeData.scroll.y = displacement > 0 ? 0 : -runtimeData.maxScroll.y
                runtimeData.velocity = 0
            }
        }

        let nextScrollY = runtimeData.scroll.y + runtimeData.velocity

        if (!isControlActive) {
            // 速度限制
            const maxVel = 40
            runtimeData.velocity = clamp(runtimeData.velocity, -maxVel, maxVel)

            // 边界硬碰撞与吸附
            // const restitution = currentRestitution.value
            const restitution = runtimeData.currCtrlType == '' ? wheelRestitution.value : wallRestitution.value

            if (runtimeData.scroll.y > 0 && nextScrollY <= 0) {
                nextScrollY = 0
                runtimeData.velocity = -runtimeData.velocity * restitution
            } else if (
                runtimeData.scroll.y < -runtimeData.maxScroll.y &&
                nextScrollY >= -runtimeData.maxScroll.y
            ) {
                nextScrollY = -runtimeData.maxScroll.y
                runtimeData.velocity = -runtimeData.velocity * restitution
            }

            // 拉伸上限
            const limit = runtimeData.currCtrlType == '' ? wheelMaxOverScroll.value : 100
            if (nextScrollY < -runtimeData.maxScroll.y - limit)
                nextScrollY = -runtimeData.maxScroll.y - limit
            if (nextScrollY > limit) nextScrollY = limit
        }

        runtimeData.scroll.y = nextScrollY

        // --- 优化：强制吸附，消除微颤 ---
        // 当速度很小，且位置非常接近边界(0或maxScroll)时，直接归位
        // 这样可以避免在 0.1px 的范围内反复计算弹簧力
        if (!runtimeData.isOverscrolling && !isControlActive) {
            if (Math.abs(runtimeData.velocity) < 0.1) {
                // 靠近顶部
                if (Math.abs(runtimeData.scroll.y) < 0.2) {
                    runtimeData.scroll.y = 0
                    runtimeData.velocity = 0
                }
                // 靠近底部
                else if (Math.abs(runtimeData.scroll.y + runtimeData.maxScroll.y) < 0.2) {
                    runtimeData.scroll.y = -runtimeData.maxScroll.y
                    runtimeData.velocity = 0
                }
            }
        }

        // --- 休眠判断 (按需渲染核心) ---
        // 只有在以下情况才继续循环，否则停止
        let shouldContinue = false
        // 1. 用户正在交互 (必须保持循环以响应实时输入)
        if (runtimeData.currCtrlType == 'midnav' || runtimeData.currCtrlType == 'scrollbar') {
            shouldContinue = true
        }
        // 2. 速度足够大 (惯性还在)
        else if (Math.abs(runtimeData.velocity) > config.stopThreshold) {
            shouldContinue = true
        }
        // 3. 处于过界位置且未悬停 (需要弹簧拉回)
        else if (runtimeData.isOverscrolling) {
            shouldContinue = true
        }
        // 4. 处于悬停状态 (这里我们选择停止循环，因为定时器会唤醒它)
        // 如果悬停时我们也不循环，那么 rafId 会变成 null。
        // 当定时器触发时，会调用 startLoop 重新启动。
        // else if (runtimeData.isWheelFreezing) {
        //     shouldContinue = false;
        // }

        if (shouldContinue) {
            runtimeData.rafId = requestAnimationFrame(physicsLoop)
        } else {
            runtimeData.rafId = null // 休眠
        }

        // console.log(runtimeData.velocity);

        // if(runtimeData.velocity != 0){
        //     runtimeData.rafId = requestAnimationFrame(physicsLoop)
        // }
        // runtimeData.rafId = requestAnimationFrame(physicsLoop)
    }
    return physicsLoop
}
