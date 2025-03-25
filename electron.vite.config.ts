import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '~': resolve('src/main'),
        '@appTypes': resolve('src/types'),
        '@appUtils': resolve('src/utils'),
        '@locales': resolve('src/main/locales')
      }
    },
    plugins: [externalizeDepsPlugin({ exclude: ['file-type'] })]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '~': resolve('src/renderer/src'),
        '@ui': resolve('src/renderer/src/components/ui'),
        '@appTypes': resolve('src/types'),
        '@appUtils': resolve('src/utils'),
        '@assets': resolve('src/renderer/assets'),
        '@locales': resolve('src/renderer/locales')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          splash: resolve(__dirname, 'src/renderer/splash.html')
        }
      }
    }
  }
})
