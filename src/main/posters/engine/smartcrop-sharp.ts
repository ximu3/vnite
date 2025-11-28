/**
 * This file is based on the original `smartcrop-sharp` implementation.
 * https://github.com/jwagner/smartcrop-sharp/blob/main/index.js
 *
 * The official published version of `smartcrop-sharp` is not compatible with Node 22,
 * so we copied the source code and applied custom modifications to make it work
 * in our current project environment.
 *
 */
import { CanvasImage } from '@appTypes/poster'
import sharp, { Sharp } from 'sharp'
import { Canvas } from 'skia-canvas'
import smartcrop, { CropOptions, CropResult } from 'smartcrop'

class ImgData {
  width: number
  height: number
  data: Buffer

  constructor(width: number, height: number, data: Buffer) {
    this.width = width
    this.height = height
    this.data = data
  }
}

function rgb2rgba(input: Buffer): Buffer {
  const output = Buffer.alloc((input.length / 3) * 4)
  for (let i = 0; i < input.length; i += 3) {
    const j = (i / 3) * 4
    output[j] = input[i]
    output[j + 1] = input[i + 1]
    output[j + 2] = input[i + 2]
    output[j + 3] = 255
  }
  return output
}

interface ImageWrapper {
  width: number
  height: number
  _sharp: Sharp
}

const iop = {
  open: async (imgData: ImageWrapper): Promise<ImageWrapper> => {
    return imgData
  },

  resample: async (image: ImageWrapper, width: number, height: number): Promise<ImageWrapper> => {
    return {
      width: Math.floor(width),
      height: Math.floor(height),
      _sharp: image._sharp
    }
  },

  getData: async (image: ImageWrapper): Promise<ImgData> => {
    const data = await image._sharp
      .resize(image.width, image.height, { kernel: sharp.kernel.cubic })
      .raw()
      .toBuffer()

    let buffer = data
    if (data.length === image.width * image.height * 3) {
      buffer = rgb2rgba(data)
    }

    if (buffer.length !== image.width * image.height * 4) {
      throw new Error(`Unexpected data length ${buffer.length}`)
    }

    return new ImgData(image.width, image.height, buffer)
  }
}

export async function crop(img: CanvasImage, options?: CropOptions): Promise<CropResult> {
  const opts = { ...(options || {}), imageOperations: iop }
  const canvas = new Canvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, img.width, img.height)
  const imageData = ctx.getImageData(0, 0, img.width, img.height)

  const sharpImg = sharp(Buffer.from(imageData.data.buffer), {
    raw: {
      width: img.width,
      height: img.height,
      channels: 4
    }
  }).png()

  // We use `any` here because the object should match the interface expected by our custom `iop`.
  // TypeScript's official types for SmartCrop are not flexible enough to include,
  // but at runtime this works correctly and is fully handled by `iop`.
  return smartcrop.crop(
    { width: img.width, height: img.height, _sharp: sharpImg } as any,
    opts as any
  )
}
