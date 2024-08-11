import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    publicDir: false,
    build: {
      rollupOptions: {
        output: {
          format: 'es'
        },
        external: [/\.git\/.*/] // 忽略 .git 文件夹
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    publicDir: false,
    build: {
      rollupOptions: {
        output: {
          format: 'es'
        },
        external: [/\.git\/.*/] // 忽略 .git 文件夹
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    publicDir: false,
    plugins: [react()],
    build: {
      rollupOptions: {
        external: [/\.git\/.*/] // 忽略 .git 文件夹
      }
    }
  }
})