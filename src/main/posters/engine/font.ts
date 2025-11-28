import { CanvasContext } from '@appTypes/poster'

type FontStyle = 'normal' | 'italic' | 'oblique'
type FontVariant = 'normal' | 'small-caps'
type FontWeightNumber = `${100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`
type FontWeight = 'normal' | 'bold' | FontWeightNumber

interface FontState {
  fontStyle: FontStyle
  fontVariant: FontVariant
  fontWeight: FontWeight
  fontSize: number // px
  fontFamily: string
}

class FontManager {
  private defaultState: FontState = {
    fontStyle: 'normal',
    fontVariant: 'normal',
    fontWeight: 'normal',
    fontSize: 28,
    fontFamily: 'sans-serif'
  }
  private state: FontState = { ...this.defaultState }
  private lastState: FontState | null = null

  save(): void {
    this.lastState = { ...this.state }
  }
  restore(): void {
    if (this.lastState) {
      this.state = this.lastState
      this.lastState = null
    } else {
      console.warn('FontManager restore called but no saved state')
    }
  }
  reset(): void {
    this.state = { ...this.defaultState }
    this.lastState = null
  }

  setFontStyle(style: FontStyle): void {
    this.state.fontStyle = style
  }
  setFontVariant(variant: FontVariant): void {
    this.state.fontVariant = variant
  }
  setFontWeight(weight: FontWeight): void {
    this.state.fontWeight = weight
  }
  setFontSize(size: number): void {
    this.state.fontSize = size
  }
  setFontFamily(family: string): void {
    this.state.fontFamily = family
  }

  apply(ctx: CanvasContext): void {
    const s = this.state
    ctx.font = `${s.fontStyle} ${s.fontVariant} ${s.fontWeight} ${s.fontSize}px ${s.fontFamily}`
  }
}

export const fontManager = new FontManager()
