import type { JsonOnlyReportType, ReportExportResponse } from '@appTypes/report'
import { format } from 'date-fns'
import { ipcManager } from '~/app/ipc'

export function formatReportGeneratedAt(date: Date): string {
  return format(date, "yyyy-MM-dd HH:mm:ss 'UTC'xxx")
}

export async function exportJsonReport(
  reportType: JsonOnlyReportType,
  outputPath: string,
  report: unknown
): Promise<ReportExportResponse> {
  return await ipcManager.invoke('report:export', {
    reportType,
    format: 'json',
    outputPath,
    json: `${JSON.stringify(report, null, 2)}\n`
  })
}
