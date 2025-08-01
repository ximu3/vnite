import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
// @ts-ignore moduleResolution problem with tailwindcss
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '~': resolve('src/main'),
        '@locales': resolve('src/main/locales'),
        '@appTypes': resolve('src/types'),
        '@appUtils': resolve('src/utils')
      }
    },
    plugins: [externalizeDepsPlugin({ exclude: ['electron-context-menu'] })]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '~': resolve('src/renderer/src'),
        '@ui': resolve('src/renderer/src/components/ui'),
        '@locales': resolve('src/renderer/locales'),
        '@assets': resolve('src/renderer/assets'),
        '@appTypes': resolve('src/types'),
        '@appUtils': resolve('src/utils')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
