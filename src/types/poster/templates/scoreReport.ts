import { FieldSchema } from './schema'

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
  useSmallCover1: boolean
  useSmallCover2: boolean
  useSmallCover3: boolean
  useSmallCover4: boolean
  useSmallCover5: boolean
  splitColor: string
  splitWidth: number
  drawScore: boolean
  scoreColor: string
  fontColor: string
  backgroundColor: string
}

export const defaultScoreReportPayload: ScoreReportPayload = {
  maxWidth: 1600,
  titleWidth: 50,
  gameCoverHeightSmall: 210,
  gameCoverHeightLarge: 300,
  padding: 10,
  gap: 10,
  titleColor1: '#ff0000',
  titleColor2: '#ffc000',
  titleColor3: '#ffff00',
  titleColor4: '#fff2cc',
  titleColor5: '#ffffff',
  useSmallCover1: false,
  useSmallCover2: false,
  useSmallCover3: false,
  useSmallCover4: false,
  useSmallCover5: false,
  splitColor: 'hsl(223 30% 75%)',
  splitWidth: 2,
  drawScore: true,
  scoreColor: 'hsl(223 45% 44%)',
  fontColor: 'hsl(0 0% 100%)',
  backgroundColor: 'hsl(230 24% 19%)'
}

export const scoreReportSchema: FieldSchema<ScoreReportPayload>[] = [
  { key: 'maxWidth', type: 'number', min: 800, max: 3000, step: 10 },
  { key: 'titleWidth', type: 'number', min: 0, max: 100, step: 5 },
  {
    key: 'gameCoverHeightSmall',
    type: 'number',
    min: 50,
    max: 500,
    step: 5
  },
  {
    key: 'gameCoverHeightLarge',
    type: 'number',
    min: 100,
    max: 600,
    step: 5
  },
  { key: 'drawScore', type: 'checkbox' },
  { key: 'scoreColor', type: 'color' },
  { key: 'fontColor', type: 'color' },
  { key: 'backgroundColor', type: 'color' },
  { key: 'splitColor', type: 'color' },
  { key: 'splitWidth', type: 'number', min: 1, max: 20, step: 1 },
  { key: 'padding', type: 'number', min: 0, max: 30, step: 1 },
  { key: 'gap', type: 'number', min: 0, max: 30, step: 1 },
  { key: 'titleColor1', type: 'color' },
  { key: 'titleColor2', type: 'color' },
  { key: 'titleColor3', type: 'color' },
  { key: 'titleColor4', type: 'color' },
  { key: 'titleColor5', type: 'color' },
  { key: 'useSmallCover1', type: 'checkbox' },
  { key: 'useSmallCover2', type: 'checkbox' },
  { key: 'useSmallCover3', type: 'checkbox' },
  { key: 'useSmallCover4', type: 'checkbox' },
  { key: 'useSmallCover5', type: 'checkbox' }
]
