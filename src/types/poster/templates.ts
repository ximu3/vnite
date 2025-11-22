export interface ScoreReportPayload {
  maxWidth: number
  titleWidth: number
  gameCoverHeightSmall: number
  gameCoverHeightLarge: number
  padding: number // 每个等级框的的上下左右内边距
  gap: number // 游戏海报排列的xy间距
  titleColor1: string
  titleColor2: string
  titleColor3: string
  titleColor4: string
  titleColor5: string
  splitColor: string
  splitWidth: number
}

const defaultScoreReportPayload: ScoreReportPayload = {
  maxWidth: 1600,
  titleWidth: 200,
  gameCoverHeightSmall: 210,
  gameCoverHeightLarge: 300,
  padding: 10,
  gap: 10,
  titleColor1: '#ff0000',
  titleColor2: '#ffc000',
  titleColor3: '#ffff00',
  titleColor4: '#fff2cc',
  titleColor5: '#ffffff',
  splitColor: 'hsl(223 30% 75%)',
  splitWidth: 2
}

export interface TemplatePayloads {
  scoreReport: ScoreReportPayload
}

export const defaultPayloadMap: { [T in keyof TemplatePayloads]: TemplatePayloads[T] } = {
  scoreReport: defaultScoreReportPayload
}
