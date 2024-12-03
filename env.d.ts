// env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 共享变量
  readonly VITE_IGDB_API_ID: string
  readonly VITE_IGDB_API_KEY: string
  readonly VITE_STEAM_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
