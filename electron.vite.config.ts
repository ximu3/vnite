import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
// @ts-ignore moduleResolution problem with tailwindcss
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '~': resolve('src/main'),
        '@locales': resolve('src/main/locales'),
        '@appTypes': resolve('src/types'),
        '@appUtils': resolve('src/utils'),
        '@resources': resolve('resources')
      }
    },
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          'electron-context-menu',
          // @jsquash/avif is kept as a devDependency so electron-builder does not copy
          // the entire package. Rollup instead bundles only the imported decoder code
          // and WASM asset.
          //
          // The package is ESM-only and must be bundled for the CJS main-process output.
          // Although devDependencies are not normally externalized, keep this exclusion
          // explicitly to ensure it remains bundled if its dependency classification changes.
          '@jsquash/avif'
        ]
      })
    ]
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
        '@resources': resolve('resources'),
        '@appTypes': resolve('src/types'),
        '@appUtils': resolve('src/utils')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
