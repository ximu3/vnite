import { dialog, OpenDialogOptions } from 'electron'
import path from 'path'
import sharp from 'sharp'

export async function selectPathDialog(
  properties: NonNullable<OpenDialogOptions['properties']>,
  extensions?: string[],
  defaultPath?: string
): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: properties,
    filters: extensions ? [{ name: 'All Files', extensions: extensions }] : undefined,
    defaultPath: defaultPath
  })
  return result.filePaths[0]
}

export async function selectMultiplePathDialog(
  properties: NonNullable<OpenDialogOptions['properties']>,
  extensions?: string[],
  defaultPath?: string
): Promise<string[] | undefined> {
  if (!properties.includes('multiSelections')) {
    properties.push('multiSelections')
  }
  const result = await dialog.showOpenDialog({
    properties: properties,
    filters: extensions ? [{ name: 'All Files', extensions: extensions }] : undefined,
    defaultPath: defaultPath
  })
  return result.filePaths
}

export async function saveImageAsFileDialog(sourcePath: string): Promise<boolean> {
  if (!sourcePath) return false

  const defaultName = path.basename(sourcePath) || 'image.png'
  const exts = ['png', 'jpg', 'jpeg', 'webp', 'bmp']

  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [{ name: 'Images', extensions: exts }]
  })

  if (canceled || !filePath) return false

  try {
    const ext = path.extname(filePath).toLowerCase().replace('.', '')
    if (exts.includes(ext)) {
      await sharp(sourcePath)[ext === 'jpg' ? 'jpeg' : ext]().toFile(filePath)
    } else {
      throw new Error(`Unsupported file format: .${ext}`)
    }

    return true
  } catch (error) {
    console.error('system:save-image-as-file-dialog error', error)
    throw error
  }
}
