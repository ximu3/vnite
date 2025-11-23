import { PosterTemplate, RenderOptions, RenderResponse, TemplatePayloads } from '@appTypes/poster'
import { format } from 'date-fns'
import path from 'path'
import { saveCanvas } from './engine/canvas'
import { scoreReportPoster } from './templates/scoreReport'

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
    options: RenderOptions
  ): Promise<RenderResponse> {
    const tpl = this.templates.get(id as string)
    if (!tpl) throw new Error(`Unknown template: ${id}`)

    const result = await tpl.render(payload)

    const now = new Date()
    const timestamp = format(now, 'yyyyMMdd-HHmmss')
    const filename = `${id}-${timestamp}.png`
    const filePath = path.join(options.outputPath, filename)
    await saveCanvas(result.canvas, filePath)

    return { outputFile: filePath }
  }
}

const templates: {
  [K in keyof TemplatePayloads]: PosterTemplate<TemplatePayloads[K]>
} = {
  scoreReport: scoreReportPoster
} as const

for (const [id, tpl] of Object.entries(templates)) {
  PosterRegistrar.register(id as keyof TemplatePayloads, tpl)
}
