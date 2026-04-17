import { ref, computed } from 'vue'
import { clamp } from './utils.js'

export default function useLoop(runtimeData) {
    const config = {
        maxDistance: 70,
        friction: 0.95,
        stopThreshold: 0.05,
        pullThreshold: 80,
    }

    // 弹簧硬度, 越大可拉伸距离(过界)越短
    const springStiffness = ref(0.1);
    // 弹簧阻尼, 越大回弹越激烈
    const springDamping = ref(0.9);
    // 弹簧撞墙回弹, 越大回弹越激烈
    const wallRestitution = ref(0.6);

    // 滚轮回弹强度, 越大回弹越激烈
    const wheelRestitution = ref(0.4);
    // 滚轮最大拉伸范围
    const wheelMaxOverScroll = ref(200);

    const currentRestitution = computed(() => {
        if (runtimeData.inputSource === "wheel") {
          return wheelRestitution.value;
        }
        return wallRestitution.value;
      });

    const physicsLoop = () => {
        let activeInputY = 0
        let isControlActive = false

        // if (runtimeData.isDragging) {
        //     activeInputY = itemY.value
        //     isControlActive = true
        //     runtimeData.inputSource = 'stick'
        //     runtimeData.isWheelFreezing = false
        //     if (freezeTimer) {
        //         clearTimeout(freezeTimer)
        //         freezeTimer = null
        //     }
        // } else if (isMiddleMouseActive.value) {
        //     activeInputY = virtualItemY.value
        //     isControlActive = true
        //     runtimeData.inputSource = 'middle'
        //     runtimeData.isWheelFreezing = false
        //     if (freezeTimer) {
        //         clearTimeout(freezeTimer)
        //         freezeTimer = null
        //     }
        // }

        if (isControlActive) {
            // const sensitivity =
            //     runtimeData.inputSource === 'stick' ? stickSensitivity.value : mouseSensitivity.value
            // runtimeData.velocity = -activeInputY * sensitivity
        } else {
            if (Math.abs(runtimeData.velocity) < config.stopThreshold) {
                runtimeData.velocity = 0
            } else {
                runtimeData.velocity *= config.friction
            }
        }

        // if (ulRef.value && boxRef.value) {
        //     const contentH = ulRef.value.offsetHeight
        //     const containerH = boxRef.value.offsetHeight
        //     runtimeData.maxScroll = Math.min(0, -(contentH - containerH))
        // }

        let displacement = 0
        runtimeData.isOverscrolling = false

        if (runtimeData.scroll.y > 0) {
            displacement = runtimeData.scroll.y
            // runtimeData.isOverscrolling = true
            // topPullRatio.value = runtimeData.scroll.y / config.pullThreshold
        } else if (runtimeData.scroll.y < runtimeData.maxScroll) {
            displacement = runtimeData.scroll.y - runtimeData.maxScroll
            // runtimeData.isOverscrolling = true
            // bottomPullRatio.value = Math.abs(runtimeData.scroll.y - runtimeData.maxScroll) / config.pullThreshold
        } else {
            // if (topPullRatio.value > 0) topPullRatio.value = 0
            // if (bottomPullRatio.value > 0) bottomPullRatio.value = 0
        }

        if (displacement !== 0) {
            if (runtimeData.isWheelFreezing) {
                runtimeData.velocity *= 0.5
                displacement = 0
            } else {
                let springForce = -displacement * springStiffness.value
                runtimeData.velocity += springForce
                runtimeData.velocity *= springDamping.value
            }

            if (
                !runtimeData.isWheelFreezing &&
                Math.abs(runtimeData.velocity) < 0.2 &&
                Math.abs(displacement) < 0.2
                
            ) {
                runtimeData.scroll.y = displacement > 0 ? 0 : runtimeData.maxScroll
                runtimeData.velocity = 0
                runtimeData.isWheelFreezing = false
            }
        }

        let nextScrollY = runtimeData.scroll.y + runtimeData.velocity

        if (!isControlActive) {
            const maxVel = 40
            runtimeData.velocity = clamp(runtimeData.velocity, -maxVel, maxVel)

            const restitution = currentRestitution.value

            if (!runtimeData.isWheelFreezing) {
                if (runtimeData.scroll.y > 0 && nextScrollY <= 0) {
                    nextScrollY = 0
                    runtimeData.velocity = -runtimeData.velocity * restitution
                } else if (runtimeData.scroll.y < runtimeData.maxScroll && nextScrollY >= runtimeData.maxScroll) {
                    nextScrollY = runtimeData.maxScroll
                    runtimeData.velocity = -runtimeData.velocity * restitution
                }
            }

            const limit = runtimeData.inputSource === 'wheel' ? wheelMaxOverScroll.value : 100
            if (nextScrollY < runtimeData.maxScroll - limit) nextScrollY = runtimeData.maxScroll - limit
            if (nextScrollY > limit) nextScrollY = limit
        }

        runtimeData.scroll.y = nextScrollY

        // --- 优化：强制吸附，消除微颤 ---
        // 当速度很小，且位置非常接近边界(0或maxScroll)时，直接归位
        // 这样可以避免在 0.1px 的范围内反复计算弹簧力
        if (!runtimeData.isOverscrolling && !isControlActive && !runtimeData.isWheelFreezing) {
            if (Math.abs(runtimeData.velocity) < 0.1) {
                // 靠近顶部
                if (Math.abs(runtimeData.scroll.y) < 0.2) {
                    runtimeData.scroll.y = 0
                    runtimeData.velocity = 0
                }
                // 靠近底部
                else if (Math.abs(runtimeData.scroll.y - runtimeData.maxScroll) < 0.2) {
                    runtimeData.scroll.y = runtimeData.maxScroll
                    runtimeData.velocity = 0
                }
            }
        }
        // console.log(runtimeData.velocity);
        
        // if(runtimeData.velocity != 0){
        //     runtimeData.rafId = requestAnimationFrame(physicsLoop)
        // }
        runtimeData.rafId = requestAnimationFrame(physicsLoop)
        
    }
    return physicsLoop
}
