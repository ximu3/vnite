import { Card, CardContent } from '@ui/card'
import { useTranslation } from 'react-i18next'

export function ReportExportSettingRow({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium leading-none">{title}</div>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        <div className="shrink-0">{children}</div>
      </CardContent>
    </Card>
  )
}

export function ReportExportSettingsForm({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Card className="mt-4">
      <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 relative">
        <div className="absolute top-0 bottom-0 left-1/2 border-r border-primary pointer-events-none" />
        {children}
      </CardContent>
    </Card>
  )
}

export function EmptyReportConfigForm(): React.JSX.Element {
  const { t } = useTranslation('record')
  return (
    <Card className="mt-4 border-dashed">
      <CardContent className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
        {t('exportReport.settings.empty')}
      </CardContent>
    </Card>
  )
}
