import type { ReportExportRequest } from '@appTypes/report'
import { ipcManager } from '~/core/ipc'
import { exportReport } from './export'
import { createReportFontSubset } from './font'

export function setupReportIPC(): void {
  ipcManager.handle('report:create-font-subset', async (_, text: string) =>
    createReportFontSubset(text)
  )

  ipcManager.handle('report:export', async (_, request: ReportExportRequest) =>
    exportReport(request)
  )
}
