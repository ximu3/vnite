export interface ReportGeneratorProps {
  outputPath: string
  isExporting: boolean
  resolveOutputPath: () => Promise<string | undefined>
  onExportingChange: (isExporting: boolean) => void
}
