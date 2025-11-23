export interface ScoreReportPayload {
  maxWidth: number
  titleWidth: number
  gameCoverHeightSmall: number
  gameCoverHeightLarge: number
  padding: number //  padding of each level box
  gap: number // xy spacing of the game poster
  titleColor1: string
  titleColor2: string
  titleColor3: string
  titleColor4: string
  titleColor5: string
  useSamllCover1: boolean
  useSamllCover2: boolean
  useSamllCover3: boolean
  useSamllCover4: boolean
  useSamllCover5: boolean
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
  useSamllCover1: false,
  useSamllCover2: false,
  useSamllCover3: false,
  useSamllCover4: false,
  useSamllCover5: false,
  splitColor: 'hsl(223 30% 75%)',
  splitWidth: 2
}

export interface TemplatePayloads {
  scoreReport: ScoreReportPayload
}

export const defaultPayloadMap: { [T in keyof TemplatePayloads]: TemplatePayloads[T] } = {
  scoreReport: defaultScoreReportPayload
}
