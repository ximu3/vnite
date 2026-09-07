import smartcrop from 'smartcrop'

const WEBP_QUALITY = 0.85
const DEFAULT_PIXEL_RATIO = 2

export interface PreparedReportCover {
  src: string
  position: string
}

export interface PrepareReportCoverOptions {
  src: string
  width: number
  height: number
  pixelRatio?: number
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to encode report image'))
    reader.readAsDataURL(blob)
  })
}

async function loadImage(blob: Blob): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(blob)
  const image = new Image()
  image.src = objectUrl

  try {
    await image.decode()
    return { image, objectUrl }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

async function calculateCoverPosition(
  image: HTMLImageElement,
  width: number,
  height: number
): Promise<string> {
  const targetRatio = width / height
  const imageRatio = image.naturalWidth / image.naturalHeight

  // Symmetric metric for aspect ratio difference:
  // - swapping imageRatio and targetRatio does not change the value
  // - swapping width and height of either ratio (transpose) also preserves the value
  const ratioDiff = Math.abs(Math.log(imageRatio / targetRatio))

  // Use smartcrop when the cropped portion exceeds roughly 22% relative to the visible area
  // Computed as: exp(ratioDiff) - 1
  if (ratioDiff <= 0.2) return 'center'

  const result = await smartcrop.crop(image, { width, height })
  const crop = result.topCrop

  // The meaning of objectPosition is: the point at (u%, v%) in the source image
  // aligns with the point at (u%, v%) in the display container.
  // Therefore, the following calculation is based on the equations:
  // crop.x + crop.width * u = image.naturalWidth * u
  // crop.y + crop.height * v = image.naturalHeight * v
  const widthDelta = image.naturalWidth - crop.width
  const heightDelta = image.naturalHeight - crop.height
  const x = widthDelta > 0 ? (crop.x / widthDelta) * 100 : 50
  const y = heightDelta > 0 ? (crop.y / heightDelta) * 100 : 50

  const safeX = x >= 0 && x <= 100 ? x : 50
  const safeY = y >= 0 && y <= 100 ? y : 50
  return `${safeX}% ${safeY}%`
}

async function resizeImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  pixelRatio: number
): Promise<Blob> {
  const requiredWidth = Math.max(1, Math.round(width * pixelRatio))
  const requiredHeight = Math.max(1, Math.round(height * pixelRatio))
  const resizeScale = Math.min(
    1,
    Math.max(requiredWidth / image.naturalWidth, requiredHeight / image.naturalHeight)
  )
  const targetWidth = Math.max(1, Math.round(image.naturalWidth * resizeScale))
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * resizeScale))
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Failed to create report image canvas')
  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode report image'))),
      'image/webp',
      WEBP_QUALITY
    )
  })
}

export async function prepareReportCover({
  src,
  width,
  height,
  pixelRatio = DEFAULT_PIXEL_RATIO
}: PrepareReportCoverOptions): Promise<PreparedReportCover> {
  const response = await fetch(src)
  if (!response.ok) throw new Error(`Cover request failed with status ${response.status}`)

  const sourceBlob = await response.blob()
  const { image, objectUrl } = await loadImage(sourceBlob)

  try {
    const positionPromise = calculateCoverPosition(image, width, height)
    const [position, resizedBlob] = await Promise.all([
      positionPromise,
      resizeImage(image, width, height, pixelRatio)
    ])
    return {
      src: await blobToDataUrl(resizedBlob),
      position
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
