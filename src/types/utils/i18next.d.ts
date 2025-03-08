import 'i18next'

declare module 'i18next' {
  interface Services {
    formatter: {
      add: (name: string, formatter: (value: any, lng?: string, options?: any) => string) => void
    }
  }
}
