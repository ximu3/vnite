export interface ThemeAPI {
  saveTheme(cssContent: string): Promise<void>
  loadTheme(): Promise<string>
  themePreset(preset: string): Promise<string>
  setConfigBackground(filePaths: string[]): Promise<void>
}
