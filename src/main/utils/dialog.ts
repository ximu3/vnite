import { dialog } from 'electron'
import { OpenDialogOptions } from 'electron'

export async function selectPathDialog(
  properties: NonNullable<OpenDialogOptions['properties']>,
  extensions?: string[]
): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: properties,
    filters: extensions ? [{ name: 'All Files', extensions: extensions }] : undefined
  })
  return result.filePaths[0]
}

export async function selectMultiplePathDialog(
  properties: NonNullable<OpenDialogOptions['properties']>,
  extensions?: string[]
): Promise<string[] | undefined> {
  if (!properties.includes('multiSelections')) {
    properties.push('multiSelections')
  }
  const result = await dialog.showOpenDialog({
    properties: properties,
    filters: extensions ? [{ name: 'All Files', extensions: extensions }] : undefined
  })
  return result.filePaths
}
