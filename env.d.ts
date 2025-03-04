// env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 共享变量
  readonly VITE_IGDB_API_ID: string
  readonly VITE_IGDB_API_KEY: string
  readonly VITE_STEAM_API_KEY: string

  readonly VITE_CASDOOR_SERVER_URL: string
  readonly VITE_CASDOOR_CLIENT_ID: string
  readonly VITE_CASDOOR_CLIENT_SECRET: string
  readonly VITE_CASDOOR_APP_NAME: string
  readonly VITE_CASDOOR_ORGANIZATION_NAME: string
  readonly VITE_CASDOOR_CALLBACK_PORT: number
  readonly VITE_CASDOOR_CERTIFICATE: string

  readonly VITE_COUCHDB_SERVER_URL: string
  readonly VITE_COUCHDB_ADMIN_USERNAME: string
  readonly VITE_COUCHDB_ADMIN_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
