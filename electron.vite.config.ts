import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '~': resolve('src/main')
      }
    },
    plugins: [externalizeDepsPlugin({ exclude: ['lowdb', 'webdav', 'file-type'] })]
  },
  preload: {
    resolve: {
      alias: {
        '~': resolve('src/main')
      }
    },
    plugins: [externalizeDepsPlugin({ exclude: ['lowdb', 'webdav', 'file-type'] })]
  },
  renderer: {
    resolve: {
      alias: {
        '~': resolve('src/renderer/src'),
        '@ui': resolve('src/renderer/src/components/ui')
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
