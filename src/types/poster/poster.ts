import type { Canvas, CanvasRenderingContext2D as SkiaCtx, Image as SkiaImage } from 'skia-canvas'

export type CanvasContext = SkiaCtx
export type CanvasImage = SkiaImage

export interface RenderOptions {
  outputPath?: string
}

export interface RenderResult {
  canvas: Canvas
  width: number
  height: number
}

export interface PosterTemplate<Payload> {
  id: string
  render(payload: Payload): Promise<RenderResult>
}
