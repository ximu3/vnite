import type { ReportExportOptions } from '@appTypes/report'
import { StepperInput } from '@ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Switch } from '@ui/switch'
import { useTranslation } from 'react-i18next'
import { useConfigLocalState } from '~/hooks'
import { ReportExportSettingRow } from '../settings'

export function ScoreReportExportSettings(): React.JSX.Element {
  const { t } = useTranslation('record')
  const [options, setOptions] = useConfigLocalState('report.reports.scoreReport')

  const setting = (
    key: keyof ReportExportOptions['reports']['scoreReport'],
    field: 'title' | 'description'
  ): string => t(`exportReport.settings.scoreReport.${key}.${field}`)

  return (
    <>
      <ReportExportSettingRow
        title={setting('variant', 'title')}
        description={setting('variant', 'description')}
      >
        <Select
          value={options.variant}
          onValueChange={(value) => {
            void setOptions({
              ...options,
              variant: value as ReportExportOptions['reports']['scoreReport']['variant']
            })
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">
              {t('exportReport.settings.scoreReport.variant.options.A')}
            </SelectItem>
            <SelectItem value="B">
              {t('exportReport.settings.scoreReport.variant.options.B')}
            </SelectItem>
          </SelectContent>
        </Select>
      </ReportExportSettingRow>

      <ReportExportSettingRow
        title={setting('coverWidth', 'title')}
        description={setting('coverWidth', 'description')}
      >
        <StepperInput
          className="w-30"
          value={options.coverWidth}
          min={80}
          max={180}
          steps={{ default: 10, ctrl: 20 }}
          onChange={(event) => {
            void setOptions({ ...options, coverWidth: Number(event.target.value) })
          }}
        />
      </ReportExportSettingRow>

      <ReportExportSettingRow
        title={setting('theme', 'title')}
        description={setting('theme', 'description')}
      >
        <Select
          value={options.theme}
          onValueChange={(value) =>
            void setOptions({
              ...options,
              theme: value as ReportExportOptions['reports']['scoreReport']['theme']
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">{t('exportReport.settings.theme.current')}</SelectItem>
            <SelectItem value="light">{t('exportReport.settings.theme.light')}</SelectItem>
            <SelectItem value="dark">{t('exportReport.settings.theme.dark')}</SelectItem>
          </SelectContent>
        </Select>
      </ReportExportSettingRow>

      <ReportExportSettingRow
        title={setting('showScore', 'title')}
        description={setting('showScore', 'description')}
      >
        <Switch
          checked={options.showScore}
          onCheckedChange={(value) => {
            void setOptions({ ...options, showScore: value })
          }}
        />
      </ReportExportSettingRow>
    </>
  )
}
