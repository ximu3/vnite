import {
  defaultPayloadMap,
  defaultRenderOptions,
  RenderOptions,
  TemplatePayloads
} from '@appTypes/poster'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PosterTemplateStore {
  renderOptions: RenderOptions
  payloads: TemplatePayloads
  setRenderOption: <K extends keyof RenderOptions>(key: K, value: RenderOptions[K]) => void
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
      renderOptions: defaultRenderOptions,
      payloads: defaultPayloadMap,
      setRenderOption: (key, value) =>
        set((state) => ({
          renderOptions: {
            ...state.renderOptions,
            [key]: value
          }
        })),
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

        // --- payloads ---
        let payloadMismatch = false

        for (const key in defaultPayloadMap) {
          const defaultPayload = defaultPayloadMap[key as keyof TemplatePayloads]
          const storedPayload = state.payloads[key as keyof TemplatePayloads]

          if (!storedPayload) {
            payloadMismatch = true
            break
          }

          const defaultKeys = Object.keys(defaultPayload)
          const storedKeys = Object.keys(storedPayload)

          if (defaultKeys.length !== storedKeys.length) {
            payloadMismatch = true
            break
          }

          for (const fieldKey of defaultKeys) {
            if (!(fieldKey in storedPayload)) {
              payloadMismatch = true
              break
            }
          }

          if (payloadMismatch) break
        }

        if (payloadMismatch) {
          state.payloads = defaultPayloadMap
        }

        // --- renderOptions ---
        let optionsMismatch = false

        const defaultOptionKeys = Object.keys(defaultRenderOptions)
        const storedOptionKeys = Object.keys(state.renderOptions ?? {})

        if (defaultOptionKeys.length !== storedOptionKeys.length) {
          optionsMismatch = true
        } else {
          for (const key of defaultOptionKeys) {
            if (!(key in state.renderOptions)) {
              optionsMismatch = true
              break
            }
          }
        }

        if (optionsMismatch) {
          state.renderOptions = defaultRenderOptions
        }
      }
    }
  )
)
