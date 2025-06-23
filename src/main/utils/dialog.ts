import { dialog } from 'electron'
import { OpenDialogOptions } from 'electron'

/**
 * Show a dialog to select a path
 * @param properties The properties of the dialog
 * @param filters The filters to use for file selection
 * @returns A promise that resolves with the selected path.
 */
export async function selectPathDialog(
  properties: NonNullable<OpenDialogOptions['properties']>,
  filters?: { name: string, extensions: string[] }[],
  defaultPath?: string
): Promise<string | undefined> {
  const result = await dialog.showOpenDialog({
    properties: properties,
    filters,
    defaultPath: defaultPath
  })
  return result.filePaths[0]
}

/**
 * Show a dialog to select multiple paths
 * @param properties The properties of the dialog
 * @param extensions The extensions to filter by
 * @returns A promise that resolves with the selected paths.
 */
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
