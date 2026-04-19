<script>
import { ref, computed } from "vue"

export default {
    components: {},
    props: {
        start: {
            type: Object,
            default: () => ({ x: 0, y: 0 }),
        },
        pos: {
            type: Object,
            default: () => ({ x: -100, y: -100 }),
        },
    },
    setup(props) {

        function calculateAngle(p1, p2) {
            // 计算向量AB的分量
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            // 处理A和B重合的特殊情况
            if (dx === 0 && dy === 0) {
                return 0; // 或抛出错误，因为角度无定义
            }
            // 计算点积和叉积
            // const dot = -dy;        // AB · AY (AY = [0, -1])
            // const cross = -dx;      // AB × AY (叉积的Z分量)
            // 计算带方向的夹角（弧度）
            let angleRad = Math.atan2(-dx, -dy);
            // 转换为顺时针角度（0-360度）
            let angleDeg = -angleRad * 180 / Math.PI;
            if (angleDeg < 0) {
                angleDeg += 360;
            }
            return angleDeg;
        }

        // 为了性能，直接比较平方和
        // const Radius = 40 * 40
        // function squaredDistance(p1, p2) {
        //     const dx = p1.x - p2.x;
        //     const dy = p1.y - p2.y;
        //     return dx * dx + dy * dy;
        // }



        const cursorStyle = computed(() => {
            return {
                transform: `translate(${props.pos.x - 16}px, ${props.pos.y - 16}px)`
            }
        })

        const rotate = computed(() => {
            // const d = squaredDistance(props.start, props.pos)
            const r = calculateAngle(props.start, props.pos)
            // if (d < Radius) {                
            //     return r * d / Radius
            // }
            return r
        })

        return {
            cursorStyle,
            rotate
        }
    },
}
</script>


<template>
    <div class="es_mid_nav_cursor" :style="cursorStyle">
        <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <g id="arrow">
                    <path
                        d="M537.643 151.04c-14.163-14.161-37.123-14.161-51.286 0L361.344 276.053c-12.849 12.438-13.01 32.991-.36 45.63 12.65 12.64 33.205 12.457 45.63-.403l44.788-44.788a85.699 85.699 180 0 1 121.196 0l44.789 44.788c12.35 13.256 33.23 13.625 46.041.814 12.81-12.81 12.441-33.692-.815-46.041z" />
                </g>
            </defs>
            <circle cx="512" cy="512" r="80" />
            <use href="#arrow" :transform="`rotate(${rotate} 512 512)`" />
            <!-- <use href="#arrow" :transform="`rotate(${rotate} 512 512)`" />
            <use href="#arrow" :transform="`rotate(${rotate} 512 512)`" />
            <use href="#arrow" :transform="`rotate(${rotate} 512 512)`" /> -->
        </svg>
    </div>
</template>

<style>
.es_mid_nav_cursor {
    position: fixed;
    z-index: 9999999;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    transform: translate(-100%, -100%);
    pointer-events: none;
    will-change: transform;
    opacity: 0.8;
}
</style>