import { cn } from '~/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Switch } from '@ui/switch'
import { useConfigState } from '~/hooks'
import { useNavigate } from 'react-router-dom'
import { Button } from '@ui/button'
import { useTranslation } from 'react-i18next'

export function Metadata(): JSX.Element {
  const { t } = useTranslation('config')
  const [transformerEnabled, setTransformerEnabled] = useConfigState('metadata.transformer.enabled')
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
        <div className={cn('flex flex-col gap-8')}>
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('metadata.transformer.title')}</div>
            <div className={cn('pl-2')}>
              <div className={cn('grid grid-cols-[1fr_auto] gap-4 items-center')}>
                <div className={cn('whitespace-nowrap select-none')}>
                  {t('metadata.transformer.enable')}
                </div>
                <div className={cn('justify-self-end')}>
                  <Switch
                    checked={transformerEnabled}
                    onCheckedChange={(checked) => setTransformerEnabled(checked)}
                  />
                </div>

                <div className={cn('whitespace-nowrap select-none')}>
                  {t('metadata.transformer.manage')}
                </div>
                <div className={cn('justify-self-end')}>
                  <Button
                    variant={'outline'}
                    onClick={() => {
                      navigate('/transformer')
                    }}
                  >
                    {t('metadata.transformer.manageButton')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
