import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '~': resolve('src/main'),
        '@types': resolve('src/types')
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
        '@appTypes': resolve('src/types')
      }
    },
    plugins: [react()]
  }
})
