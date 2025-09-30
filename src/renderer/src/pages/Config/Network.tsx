import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfigItem } from '~/components/form/ConfigItem'
import { useTranslation } from 'react-i18next'
import { useConfigLocalState } from '~/hooks'

export function Network(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [enable] = useConfigLocalState('network.proxy.enable')

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('network.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-8')}>
          {/* Proxy Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('network.proxy.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="configLocal"
                path="network.proxy.enable"
                title={t('network.proxy.enable')}
                controlType="switch"
                description={t('network.proxy.enableDescription')}
              />
              {enable && (
                <ConfigItem
                  hookType="configLocal"
                  path="network.proxy.protocol"
                  title={t('network.proxy.protocol')}
                  controlType="select"
                  description={t('network.proxy.protocolDescription')}
                  options={[
                    { value: 'http', label: t('network.proxy.protocols.http') },
                    { value: 'https', label: t('network.proxy.protocols.https') },
                    { value: 'socks4', label: t('network.proxy.protocols.socks4') },
                    { value: 'socks5', label: t('network.proxy.protocols.socks5') }
                  ]}
                  controlClassName="w-[200px]"
                />
              )}
              {enable && (
                <ConfigItem
                  hookType="configLocal"
                  path="network.proxy.host"
                  title={t('network.proxy.host')}
                  controlType="input"
                  inputType="text"
                  description={t('network.proxy.hostDescription')}
                  controlClassName="w-[200px]"
                />
              )}
              {enable && (
                <ConfigItem
                  hookType="configLocal"
                  path="network.proxy.port"
                  title={t('network.proxy.port')}
                  controlType="input"
                  inputType="number"
                  description={t('network.proxy.portDescription')}
                  controlClassName="w-[100px]"
                />
              )}
              {enable && (
                <ConfigItem
                  hookType="configLocal"
                  path="network.proxy.bypassRules"
                  title={t('network.proxy.bypassRules')}
                  controlType="textarea"
                  description={t('network.proxy.bypassRulesDescription')}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
