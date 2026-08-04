import { type ReportExportRequest, type ReportExportResponse } from '@appTypes/report'
import { format } from 'date-fns'
import { stat, writeFile } from 'fs/promises'
import path from 'path'

async function validateOutputPath(outputPath: string): Promise<void> {
  if (!path.isAbsolute(outputPath)) throw new Error('Report output path must be absolute')
  const outputDirectory = await stat(outputPath)
  if (!outputDirectory.isDirectory()) throw new Error('Report output path must be a directory')
}

export async function exportReport(request: ReportExportRequest): Promise<ReportExportResponse> {
  await validateOutputPath(request.outputPath)
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss')
  const outputFile = path.join(
    request.outputPath,
    `${request.reportType}-${timestamp}.${request.format}`
  )

  const content = request.format === 'html' ? request.html : request.json
  await writeFile(outputFile, content, 'utf8')
  return { outputFile }
}
