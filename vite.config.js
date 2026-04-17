import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), vueDevTools(),{
        name: 'copy-dts',
        writeBundle() {
          fs.copyFileSync(
            'lib/easy_scroll/index.vue.d.ts',
            'dist/easy_scroll.d.ts'
          )
        }
      }],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        lib: {
            entry: fileURLToPath(new URL('./lib/index.js', import.meta.url)),
            name: 'EasyScroll',
            // 将添加适当的扩展名后缀
            fileName: 'easy_scroll', // 动态生成文件名
            formats: ['es'],
        },
        rollupOptions: {
            external: ['vue'], // 这些库不会被打包
            // UMD 格式需要 globals
            // output: {
            //   globals: {
            //     vue: 'Vue', // 运行时从全局变量 Vue 获取, 大写，对应 window.Vue
            //   },
            // },
        },
        copyPublicDir: false,
    },
})
