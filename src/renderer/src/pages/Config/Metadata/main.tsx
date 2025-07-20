import { cn } from '~/utils'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'
import { ConfigItemPure } from '~/components/form/ConfigItemPure'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { useTranslation } from 'react-i18next'

export function Metadata(): React.JSX.Element {
  const { t } = useTranslation('config')
  const navigate = useNavigate()

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('metadata.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('space-y-4')}>
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('metadata.transformer.title')}</div>
            <div className={cn('space-y-4')}>
              {/* Transformer Enable Switch */}
              <ConfigItem
                hookType="config"
                path="metadata.transformer.enabled"
                title={t('metadata.transformer.enable')}
                description={t('metadata.transformer.enableDescription')}
                controlType="switch"
              />

              {/* Transformer Management Button */}
              <ConfigItemPure
                title={t('metadata.transformer.manage')}
                description={t('metadata.transformer.manageDescription')}
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate({ to: '/transformer' })
                  }}
                >
                  {t('metadata.transformer.manageButton')}
                </Button>
              </ConfigItemPure>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
