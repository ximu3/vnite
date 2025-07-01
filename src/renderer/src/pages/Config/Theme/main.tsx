import { cn } from '~/utils'
import { Card, CardContent } from '@ui/card'
import { useState } from 'react'
import { useTheme } from '~/components/ThemeProvider'
import { Button } from '@ui/button'
import { Textarea } from '@ui/textarea'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { PresetSelecter } from './PresetSelecter'

export function Theme(): JSX.Element {
  const { t } = useTranslation('config')
  const { theme, updateTheme } = useTheme()
  const [cssContent, setCssContent] = useState(theme || '')

  const handleSave = async (): Promise<void> => {
    updateTheme(cssContent)
    toast.success(t('theme.notifications.themeSaved'))
  }

  return (
    <Card className={cn('group')}>
      <CardContent>
        <div className={cn('flex flex-col gap-8')}>
          {/* Theme settings */}
          <div className={cn('space-y-4')}>
            {/* Preset theme selector */}
            <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
              <div className={cn('whitespace-nowrap select-none')}>
                {t('theme.themeEditor')}
              </div>
              <div className={cn('whitespace-nowrap select-none')}>
                <PresetSelecter setCssContent={setCssContent}/>
              </div>
            </div>
            {/* Current theme editor */}
            <Textarea
              value={cssContent}
              onChange={(e) => setCssContent(e.target.value)}
              className={cn('w-full h-[calc(85vh-280px)] font-mono')}
            />
            {/* Button to save the current theme */}
            <div className={cn('flex flex-row-reverse select-none')}>
              <Button onClick={handleSave}>
                {t('theme.saveButton')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
