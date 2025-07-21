// src/renderer/components/settings/FontSettingsDialog.tsx
import { useState, useEffect } from 'react'
import { Check, ChevronDown, Loader2, RefreshCcw } from 'lucide-react'
import { useConfigState } from '~/hooks'
import { Button } from '@ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@ui/dialog'
import { Command, CommandInput, CommandItem, CommandList, CommandGroup } from '@ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Textarea } from '@ui/textarea'
import { Label } from '@ui/label'
import { ScrollArea } from '@ui/scroll-area'
import { ipcManager } from '~/app/ipc'
import { changeFont } from '~/utils'
import { useTranslation } from 'react-i18next'

interface FontSettingsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function FontSettingsDialog({
  isOpen,
  onOpenChange
}: FontSettingsDialogProps): React.JSX.Element {
  // 从配置中获取当前字体设置
  const [font, setFont] = useConfigState('appearances.font')
  const [commandOpen, setCommandOpen] = useState(false)
  const [fonts, setFonts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewText, setPreviewText] = useState(
    '这是字体预览文本 The quick brown fox jumps over the lazy dog 1234567890'
  )

  const { t } = useTranslation('config')

  // 加载系统字体
  const loadSystemFonts = async (): Promise<void> => {
    try {
      setLoading(true)
      const result = await ipcManager.invoke('system:get-fonts')
      if (result && Array.isArray(result)) {
        setFonts(result)
      }
    } catch (error) {
      console.error('加载系统字体失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 当对话框打开时加载字体
  useEffect(() => {
    loadSystemFonts()
  }, [open])

  // 处理字体选择
  const handleFontSelect = (fontName: string): void => {
    changeFont(fontName)
    setFont(fontName)
    setCommandOpen(false)
  }

  // 重置为软件默认字体
  const handleResetToSoftwareFont = (): void => {
    changeFont('LXGW WenKai Mono')
    setFont('LXGW WenKai Mono')
  }

  // 重置为系统默认字体
  const handleResetToSystemFont = (): void => {
    changeFont('system-ui')
    setFont('system-ui')
  }

  // 过滤后的字体列表
  const filteredFonts = searchTerm
    ? fonts.filter((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
    : fonts

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('appearances.font.dialog.title')}</DialogTitle>
          <DialogDescription>{t('appearances.font.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="font">{t('appearances.font.dialog.currentFont')}</Label>
            <div className="flex items-center gap-2">
              <Popover open={commandOpen} onOpenChange={setCommandOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={commandOpen}
                    className="justify-between font-normal w-[200px]"
                    style={{ fontFamily: font || 'var(--font-sans)' }}
                  >
                    {font || t('appearances.font.dialog.systemDefaultFonts')}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" side="bottom" align="start">
                  <Command>
                    <CommandInput
                      placeholder={t('appearances.font.dialog.searchFont')}
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList className="scrollbar-base-thin">
                      {loading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <ScrollArea className="h-[200px] overflow-auto">
                          <CommandGroup>
                            {filteredFonts.map((fontName) => (
                              <CommandItem
                                key={fontName}
                                onSelect={() => handleFontSelect(fontName)}
                                className="flex items-center"
                              >
                                <span style={{ fontFamily: fontName }}>{fontName}</span>
                                {font === fontName && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </ScrollArea>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={loadSystemFonts} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="preview">{t('appearances.font.dialog.preview')}</Label>
            <Textarea
              id="preview"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="font-current h-[200px] resize-none"
              style={{ fontFamily: font || 'var(--font-sans)' }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleResetToSystemFont}>
            {t('appearances.font.dialog.resetToSystem')}
          </Button>
          <Button variant="outline" onClick={handleResetToSoftwareFont}>
            {t('appearances.font.dialog.resetToDefault')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{t('appearances.font.dialog.finish')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
