import { FieldSchema } from './schema'
import { defaultScoreReportPayload, ScoreReportPayload, scoreReportSchema } from './scoreReport'

export interface TemplatePayloads {
  scoreReport: ScoreReportPayload
}

export const defaultPayloadMap: { [T in keyof TemplatePayloads]: TemplatePayloads[T] } = {
  scoreReport: defaultScoreReportPayload
}

export const posterUISchemas: {
  [T in keyof TemplatePayloads]: FieldSchema<TemplatePayloads[T]>[]
} = {
  scoreReport: scoreReportSchema
}

export * from './scoreReport'
