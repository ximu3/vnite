import path from 'path'
import { PosterTemplate, RenderOptions, RenderResult } from '../../types/poster/poster'
import { saveCanvas } from './engine/canvas'
import { testPoster } from './templates/test'

export class PosterRegistrar {
  private static templates = new Map<string, PosterTemplate<any>>()

  static register<T extends keyof TemplateMap>(
    id: T,
    template: PosterTemplate<TemplateMap[T]>
  ): void {
    this.templates.set(id as string, template)
  }

  static async render<T extends keyof TemplateMap>(
    id: T,
    payload: TemplateMap[T],
    options?: RenderOptions
  ): Promise<RenderResult> {
    const tpl = this.templates.get(id as string)
    if (!tpl) throw new Error(`Unknown template: ${id}`)

    const result = await tpl.render(payload)

    if (options?.outputPath) {
      const filename = `${id}-${Date.now()}.png`
      const filePath = path.join(options.outputPath, filename)
      await saveCanvas(result.canvas, filePath)
    }

    return result
  }
}

const templates = {
  test: testPoster
} as const

export type TemplateMap = {
  [K in keyof typeof templates]: Parameters<(typeof templates)[K]['render']>[0]
}

for (const [id, tpl] of Object.entries(templates)) {
  PosterRegistrar.register(id as keyof TemplateMap, tpl)
}

export type PosterIPCMap = {
  [K in keyof TemplateMap]: (args: {
    id: K
    payload: TemplateMap[K]
    options?: RenderOptions
  }) => void
}

export interface PosterRenderArgs<T extends keyof TemplateMap = keyof TemplateMap> {
  id: T
  payload: TemplateMap[T]
  options?: RenderOptions
}

export type PosterChannelMap = {
  [K in keyof TemplateMap as `poster:render:${K & string}`]: (
    payload: TemplateMap[K],
    options?: RenderOptions
  ) => void
}
