import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useState } from 'react'
import { useTheme } from '~/components/ThemeProvider'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { PresetSelecter } from './PresetSelecter'

export function Theme(): React.JSX.Element {
  const { t } = useTranslation('config')
  const { theme, updateTheme } = useTheme()
  const [cssContent, setCssContent] = useState(theme || '')

  const handleSave = async (): Promise<void> => {
    updateTheme(cssContent)
    toast.success(t('theme.notifications.themeSaved'))
  }

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('theme.title')}</div>
            <div className={cn('flex items-center')}>
              <PresetSelecter setCssContent={setCssContent} />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-3')}>
          <Textarea
            value={cssContent}
            onChange={(e) => setCssContent(e.target.value)}
            className={cn('w-full h-[calc(85vh-280px)] resize-none')}
          />
          <div className={cn('flex flex-row-reverse')}>
            <Button onClick={handleSave} className="mt-4">
              {t('theme.saveButton')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
