// env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 共享变量
  readonly VITE_IGDB_API_ID: string
  readonly VITE_IGDB_API_KEY: string
  readonly VITE_STEAM_API_KEY: string
  readonly VITE_BANGUMI_API_KEY: string

  readonly VITE_AUTHENTIK_SERVER_URL: string
  readonly VITE_AUTHENTIK_CLIENT_ID: string
  readonly VITE_AUTHENTIK_CLIENT_SECRET: string

  readonly VITE_COUCHDB_SERVER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
