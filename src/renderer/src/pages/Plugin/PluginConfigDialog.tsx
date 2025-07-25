import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@ui/dialog'
import { Button } from '@ui/button'
import { ScrollArea } from '@ui/scroll-area'
import { Separator } from '@ui/separator'
import { toast } from 'sonner'
import { ConfigItem } from '~/components/form/ConfigItem'
import type { PluginConfiguration } from '@appTypes/plugin'
import { ipcManager } from '~/app/ipc'
import { cn } from '~/utils'

interface PluginConfigDialogProps {
  /** 插件ID */
  pluginId: string
  /** 插件名称 */
  pluginName: string
  /** 是否显示对话框 */
  open: boolean
  /** 关闭对话框的回调 */
  onClose: () => void
  /** 配置保存后的回调 */
  onSave?: () => void
}

export function PluginConfigDialog({
  pluginId,
  pluginName,
  open,
  onClose,
  onSave
}: PluginConfigDialogProps): React.JSX.Element {
  const { t } = useTranslation('plugin')
  const [configurations, setConfigurations] = useState<PluginConfiguration[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 加载插件配置项
  const loadConfigurations = async (): Promise<void> => {
    if (!pluginId || !open) return

    setLoading(true)
    try {
      const result = await ipcManager.invoke('plugin:get-plugin-configuration', pluginId)
      setConfigurations(result || [])
    } catch (error) {
      console.error('加载插件配置失败:', error)
      toast.error(t('messages.loadConfigurationFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 保存配置
  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      toast.success(t('messages.configurationSaved'))
      onSave?.()
      onClose()
    } catch (error) {
      console.error('保存插件配置失败:', error)
      toast.error(t('messages.saveConfigurationFailed'))
    } finally {
      setSaving(false)
    }
  }

  // 将PluginConfiguration转换为ConfigItem所需的props
  const getConfigItemProps = (config: PluginConfiguration): any => {
    // 确保pluginId存在
    if (!pluginId) {
      return null
    }

    const baseProps = {
      hookType: 'plugin' as const,
      path: config.id as any,
      pluginId,
      title: config.title,
      defaultValue: config.default,
      description: config.description,
      controlClassName: config.controlClassName
    }

    // 根据配置类型返回对应的props
    switch (config.type) {
      case 'string':
        return {
          ...baseProps,
          controlType: config.controlOptions.controlType,
          inputType: config.controlOptions.inputType,
          placeholder: config.controlOptions.placeholder,
          rows: config.controlOptions.rows
        }

      case 'number':
        return {
          ...baseProps,
          controlType: config.controlOptions.controlType,
          inputType: config.controlOptions.controlType === 'input' ? 'number' : undefined,
          placeholder: config.controlOptions.placeholder,
          min: config.controlOptions.min,
          max: config.controlOptions.max,
          step: config.controlOptions.step,
          formatValue: config.controlOptions.formatValue
        }

      case 'boolean':
        return {
          ...baseProps,
          controlType: config.controlOptions.controlType
        }

      case 'select':
        return {
          ...baseProps,
          controlType: config.controlOptions.controlType,
          options: config.options,
          placeholder: config.controlOptions.placeholder
        }

      case 'array':
        return {
          ...baseProps,
          controlType: config.controlOptions.controlType,
          arrayEditorPlaceholder: config.controlOptions.arrayEditorPlaceholder,
          arrayEditorTooltipText: config.controlOptions.arrayEditorTooltipText,
          arrayEditorDialogTitle: config.controlOptions.arrayEditorDialogTitle,
          arrayEditorDialogPlaceholder: config.controlOptions.arrayEditorDialogPlaceholder
        }

      case 'date':
        return {
          ...baseProps,
          controlType: config.controlOptions.controlType,
          placeholder: config.controlOptions.placeholder
        }

      case 'file':
        return {
          ...baseProps,
          controlType: config.controlOptions.controlType,
          placeholder: config.controlOptions.placeholder,
          dialogFilters: config.controlOptions.dialogFilters,
          buttonIcon: config.controlOptions.buttonIcon,
          buttonTooltip: config.controlOptions.buttonTooltip
        }

      case 'hotkey':
        return {
          ...baseProps,
          controlType: config.controlOptions.controlType,
          inputClassName: config.controlOptions.inputClassName
        }

      default:
        return baseProps
    }
  }

  useEffect(() => {
    loadConfigurations()
  }, [pluginId, open])

  return (
    <Dialog open={open && !!pluginId} onOpenChange={onClose}>
      <DialogContent className="h-[70vh] w-[50vw] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn('icon-[mdi--cog] w-5 h-5')}></span>
            {t('configDialog.title', { pluginName })}
          </DialogTitle>
          <DialogDescription>{t('configDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>{t('messages.loading')}</span>
              </div>
            </div>
          ) : configurations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <span
                className={cn('icon-[mdi--cog-outline] w-12 h-12 text-muted-foreground mb-2')}
              ></span>
              <p className="text-sm text-muted-foreground">{t('configDialog.noConfiguration')}</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-6">
              <div className="space-y-4">
                {configurations.map((config, index) => {
                  const configProps = getConfigItemProps(config)
                  if (!configProps) return null

                  return (
                    <div key={config.id}>
                      <ConfigItem className="shadow-md" {...configProps} />
                      {index < configurations.length - 1 && <Separator className="mt-4" />}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || configurations.length === 0}>
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t('actions.saving')}
              </>
            ) : (
              t('actions.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
