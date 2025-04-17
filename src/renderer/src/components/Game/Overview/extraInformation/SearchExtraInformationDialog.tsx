import { cn } from '~/utils'
import { Dialog, DialogContent } from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Card } from '@ui/card'
import { Badge } from '@ui/badge'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ipcInvoke } from '~/utils'
import { GameExtraInfoList } from '@appTypes/utils'
import { useTranslation } from 'react-i18next'

interface SearchExtraInformationDialogProps {
  isOpen: boolean
  onClose: () => void
  gameTitle: string
  onSelect: (extraInfo: { key: string; value: string }[]) => void
  initialExtraInfo?: { key: string; value: string }[]
}

export function SearchExtraInformationDialog({
  isOpen,
  onClose,
  gameTitle,
  onSelect,
  initialExtraInfo = []
}: SearchExtraInformationDialogProps): JSX.Element {
  const { t } = useTranslation('game')
  const [searchTitle, setSearchTitle] = useState(gameTitle)
  const [extraInfoList, setExtraInfoList] = useState<GameExtraInfoList>([])
  const [selectedExtraInfo, setSelectedExtraInfo] =
    useState<{ key: string; value: string }[]>(initialExtraInfo)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSearchTitle(gameTitle)
  }, [gameTitle])

  useEffect(() => {
    if (isOpen) {
      toast.promise(handleSearch(), {
        loading: t('detail.overview.extraInformation.search.loading'),
        success: t('detail.overview.extraInformation.search.success'),
        error: (err) => t('detail.overview.extraInformation.search.error', { message: err.message })
      })
    }
    setExtraInfoList([])
  }, [isOpen, t])

  useEffect(() => {
    // 初始化选中的额外信息
    if (isOpen && initialExtraInfo) {
      setSelectedExtraInfo(initialExtraInfo)
    }
  }, [isOpen, initialExtraInfo])

  async function handleSearch(): Promise<void> {
    if (isLoading) return
    setIsLoading(true)

    try {
      const result = (await ipcInvoke('get-game-extra-info-list', {
        type: 'name',
        value: searchTitle
      })) as GameExtraInfoList

      if (!result || result.length === 0) {
        toast.error(t('detail.overview.extraInformation.search.notFound'))
        return
      }

      setExtraInfoList(result)
    } catch (error) {
      toast.error(t('detail.overview.extraInformation.search.searchError', { error }))
    } finally {
      setIsLoading(false)
    }
  }

  function handleExtraInfoToggle(key: string, value: string): void {
    setSelectedExtraInfo((prevSelected) => {
      const existingItem = prevSelected.find((item) => item.key === key && item.value === value)

      if (existingItem) {
        return prevSelected.filter((item) => !(item.key === key && item.value === value))
      } else {
        return [...prevSelected, { key, value }]
      }
    })
  }

  function handleConfirm(): void {
    if (selectedExtraInfo.length === 0) {
      toast.error(t('detail.overview.extraInformation.search.selectRequired'))
      return
    }
    onSelect(selectedExtraInfo)
    handleClose()
  }

  function handleClose(): void {
    setSelectedExtraInfo(initialExtraInfo)
    setSearchTitle(gameTitle)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className={cn('w-[50vw] h-[85vh] max-w-none flex flex-col gap-3')}
      >
        <Card className={cn('p-3 w-full h-full scrollbar-base overflow-auto')}>
          {extraInfoList.length > 0 ? (
            <div className="space-y-4">
              {extraInfoList.map((source) => (
                <div key={source.dataSource} className="p-2 rounded-lg bg-background">
                  <div className="mb-2">
                    <Badge className="mb-2">{source.dataSource}</Badge>
                  </div>
                  {source.extra.map((extraItem) => (
                    <div key={extraItem.key} className="mb-3">
                      <div className="mb-1 font-medium">{extraItem.key}</div>
                      <div className="flex flex-wrap gap-2">
                        {extraItem.value.map((val) => (
                          <div
                            key={`${extraItem.key}-${val}`}
                            className="flex items-center space-x-2"
                          >
                            <label
                              htmlFor={`${source.dataSource}-${extraItem.key}-${val}`}
                              onClick={() => handleExtraInfoToggle(extraItem.key, val)}
                              className={cn(
                                'text-xs cursor-pointer rounded px-2 py-1',
                                selectedExtraInfo.some(
                                  (item) => item.key === extraItem.key && item.value === val
                                )
                                  ? 'bg-accent text-accent-foreground'
                                  : 'bg-muted'
                              )}
                            >
                              {val}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('detail.overview.extraInformation.empty')}
            </div>
          )}
        </Card>

        {/* 搜索和操作按钮区域 */}
        <Card className={cn('p-3')}>
          <div className={cn('flex flex-row gap-3')}>
            <Input
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder={t('detail.overview.search.placeholder')}
              className={cn('flex-grow')}
            />
            <Button
              onClick={() => {
                toast.promise(handleSearch(), {
                  loading: t('detail.overview.extraInformation.search.loading'),
                  success: t('detail.overview.extraInformation.search.success'),
                  error: (err) =>
                    t('detail.overview.extraInformation.search.error', { message: err.message })
                })
              }}
              size={'icon'}
              className={cn('shrink-0')}
              disabled={isLoading}
            >
              <span className={cn('icon-[mdi--magnify] w-[20px] h-[20px]')}></span>
            </Button>
            <Button onClick={handleConfirm}>{t('utils:common.confirm')}</Button>
            <Button variant="outline" onClick={handleClose}>
              {t('utils:common.cancel')}
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
