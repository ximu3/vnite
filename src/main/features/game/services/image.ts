import log from 'electron-log/main'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import { upscaleImage } from '~/utils'

async function executeConfiguredUpscale(
  imageSource: Buffer | string,
  upscaleScale: number
): Promise<Buffer> {
  const upscalerPath = await ConfigDBManager.getConfigLocalValue('game.linkage.upscaler.path')
  if (!upscalerPath) {
    throw new Error('Upscaler path is not configured')
  }

  return await upscaleImage(imageSource, upscalerPath, { scale: upscaleScale })
}

/**
 * Best-effort bypass processing for flows that have not saved the target image yet.
 * Returns the upscaled buffer when possible; otherwise returns the original input so
 * add/update callers can keep their existing persistence path and still complete.
 */
export async function tryUpscaleGameImage(
  imageSource: Buffer | string,
  upscaleScale?: number
): Promise<Buffer | string> {
  if (upscaleScale === undefined || upscaleScale === null || upscaleScale === 0) {
    return imageSource
  }

  try {
    return await executeConfiguredUpscale(imageSource, upscaleScale)
  } catch (error) {
    log.warn(`[GameImage] Failed to upscale image, using original:`, error)
    return imageSource
  }
}

/**
 * In-place replacement for an already stored game background.
 * Reads the persisted background attachment, upscales it, and writes the result
 * back to the same attachment instead of returning image data to the caller.
 */
export async function upscaleGameBackground(gameId: string, upscaleScale: number): Promise<void> {
  const backgroundImage = await GameDBManager.getGameImage(gameId, 'background')
  if (!backgroundImage) {
    throw new Error('Background image not found')
  }

  const upscaledBackgroundImage = await executeConfiguredUpscale(backgroundImage, upscaleScale)
  await GameDBManager.setGameImage(gameId, 'background', upscaledBackgroundImage)
}
