import { BrowserWindow, dialog, OpenDialogOptions } from 'electron'

/**
 * Show a dialog to select a path
 * @param properties The properties of the dialog
 * @param filters The filters to use for file selection
 * @returns A promise that resolves with the selected path.
 */
export async function selectPathDialog(
  properties: NonNullable<OpenDialogOptions['properties']>,
  filters?: { name: string, extensions: string[] }[],
  defaultPath?: string,
  parentWindow?: BrowserWindow
): Promise<string | undefined> {
  const options = { properties, filters, defaultPath }
  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, options)
    : await dialog.showOpenDialog(options)
  return result.filePaths[0]
}

/**
 * Show a dialog to select multiple paths
 * @param properties The properties of the dialog
 * @param filters The filters to use for file selection
 * @returns A promise that resolves with the selected paths.
 */
export async function selectMultiplePathDialog(
  properties: NonNullable<OpenDialogOptions['properties']>,
  filters?: { name: string, extensions: string[] }[],
  defaultPath?: string,
  parentWindow?: BrowserWindow
): Promise<string[] | undefined> {
  if (!properties.includes('multiSelections')) {
    properties.push('multiSelections')
  }
  const options = { properties, filters, defaultPath }
  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, options)
    : await dialog.showOpenDialog(options)
  return result.filePaths
}
