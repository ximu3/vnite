import { TemplatePayloads } from '@appTypes/poster'
import path from 'path'
import { PosterTemplate, RenderOptions, RenderResult } from '../../types/poster/poster'
import { saveCanvas } from './engine/canvas'
import { testPoster } from './templates'

export class PosterRegistrar {
  private static templates = new Map<string, PosterTemplate<any>>()

  static register<T extends keyof TemplatePayloads>(
    id: T,
    template: PosterTemplate<TemplatePayloads[T]>
  ): void {
    this.templates.set(id as string, template)
  }

  static async render<T extends keyof TemplatePayloads>(
    id: T,
    payload: TemplatePayloads[T],
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

const templates: {
  [K in keyof TemplatePayloads]: PosterTemplate<TemplatePayloads[K]>
} = {
  test: testPoster
} as const

for (const [id, tpl] of Object.entries(templates)) {
  PosterRegistrar.register(id as keyof TemplatePayloads, tpl)
}
