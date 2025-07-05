export interface MediaAPI {
  cropImage(params: {
    sourcePath: string
    x: number
    y: number
    width: number
    height: number
  }): Promise<string>
  saveGameIconByFile(gameId: string, filePath: string): Promise<void>
  downloadTempImage(url: string): Promise<string>
}
