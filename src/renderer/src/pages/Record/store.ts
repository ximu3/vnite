import { defaultPayloadMap, TemplatePayloads } from '@appTypes/poster'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PosterTemplateStore {
  payloads: TemplatePayloads
  setField: <T extends keyof TemplatePayloads, K extends keyof TemplatePayloads[T]>(
    template: T,
    key: K,
    value: TemplatePayloads[T][K]
  ) => void
  setPayload: <T extends keyof TemplatePayloads>(template: T, payload: TemplatePayloads[T]) => void
  resetPayload: <T extends keyof TemplatePayloads>(template: T) => void
}

export const usePosterTemplateStore = create<PosterTemplateStore>()(
  persist(
    (set) => ({
      payloads: defaultPayloadMap,
      setField: (template, key, value) =>
        set((state) => ({
          payloads: {
            ...state.payloads,
            [template]: { ...state.payloads[template], [key]: value }
          }
        })),
      setPayload: (template, payload) =>
        set((state) => ({
          payloads: {
            ...state.payloads,
            [template]: payload
          }
        })),
      resetPayload: (template) =>
        set((state) => ({
          payloads: {
            ...state.payloads,
            [template]: defaultPayloadMap[template]
          }
        }))
    }),
    {
      name: 'poster-template-store',
      onRehydrateStorage: () => (state) => {
        if (!state) return

        let hasMismatch = false

        for (const key in defaultPayloadMap) {
          const defaultPayload = defaultPayloadMap[key as keyof TemplatePayloads]
          const storedPayload = state.payloads[key as keyof TemplatePayloads]

          if (!storedPayload) {
            hasMismatch = true
            break
          }

          const defaultKeys = Object.keys(defaultPayload)
          const storedKeys = Object.keys(storedPayload)

          if (defaultKeys.length !== storedKeys.length) {
            hasMismatch = true
            break
          }

          for (const fieldKey of defaultKeys) {
            if (!(fieldKey in storedPayload)) {
              hasMismatch = true
              break
            }
          }

          if (hasMismatch) break
        }

        if (hasMismatch) {
          state.payloads = defaultPayloadMap
        }
      }
    }
  )
)
