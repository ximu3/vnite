import { cn } from '~/utils'
import { Dialog, DialogContent } from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Card } from '@ui/card'
import { Badge } from '@ui/badge'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ipcInvoke } from '~/utils'
import { GameTagsList } from '@appTypes/utils'
import { useTranslation } from 'react-i18next'

interface SearchTagsDialogProps {
  isOpen: boolean
  onClose: () => void
  gameTitle: string
  onSelect: (tags: string[]) => void
  initialTags?: string[]
}

export function SearchTagsDialog({
  isOpen,
  onClose,
  gameTitle,
  onSelect,
  initialTags = []
}: SearchTagsDialogProps): JSX.Element {
  const { t } = useTranslation('game')
  const [searchTitle, setSearchTitle] = useState(gameTitle)
  const [tagsList, setTagsList] = useState<GameTagsList>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSearchTitle(gameTitle)
  }, [gameTitle])

  useEffect(() => {
    if (isOpen) {
      toast.promise(handleSearch(), {
        loading: t('detail.overview.tags.search.loading'),
        success: t('detail.overview.tags.search.success'),
        error: (err) => t('detail.overview.tags.search.error', { message: err.message })
      })
    }
    setTagsList([])
  }, [isOpen, t])

  useEffect(() => {
    // 当对话框打开时，初始化选中的标签
    if (isOpen && initialTags) {
      setSelectedTags(initialTags)
    }
  }, [isOpen, initialTags])

  async function handleSearch(): Promise<void> {
    if (isLoading) return
    setIsLoading(true)

    try {
      const result = (await ipcInvoke('get-game-tags-list', {
        type: 'name',
        value: searchTitle
      })) as GameTagsList

      if (!result || result.length === 0) {
        toast.error(t('detail.overview.tags.search.notFound'))
        return
      }

      setTagsList(result)
    } catch (error) {
      toast.error(t('detail.overview.tags.search.searchError', { error }))
    } finally {
      setIsLoading(false)
    }
  }

  function handleTagToggle(tag: string): void {
    setSelectedTags((prevSelectedTags) => {
      if (prevSelectedTags.includes(tag)) {
        return prevSelectedTags.filter((t) => t !== tag)
      } else {
        return [...prevSelectedTags, tag]
      }
    })
  }

  function handleConfirm(): void {
    if (selectedTags.length === 0) {
      toast.error(t('detail.overview.tags.search.selectRequired'))
      return
    }
    onSelect(selectedTags)
    handleClose()
  }

  function handleClose(): void {
    setSelectedTags(initialTags)
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
          {tagsList.length > 0 ? (
            <div className="space-y-4">
              {tagsList.map((source) => (
                <div key={source.dataSource} className="p-2 rounded-lg bg-background">
                  <div className="mb-2">
                    <Badge className="mb-2">{source.dataSource}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {source.tags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <label
                          htmlFor={`${source.dataSource}-${tag}`}
                          onClick={() => handleTagToggle(tag)}
                          className={cn(
                            'text-xs cursor-pointer rounded px-2 py-1',
                            selectedTags.includes(tag)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('detail.overview.tags.empty')}
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
                  loading: t('detail.overview.tags.search.loading'),
                  success: t('detail.overview.tags.search.success'),
                  error: (err) => t('detail.overview.tags.search.error', { message: err.message })
                })
              }}
              size={'icon'}
              className={cn('shrink-0')}
              disabled={isLoading}
            >
              <span className={cn('icon-[mdi--magnify] w-[20px] h-[20px]')}></span>
            </Button>
            <Button onClick={handleConfirm}>{t('ui:common.confirm')}</Button>
            <Button variant="outline" onClick={handleClose}>
              {t('ui:common.cancel')}
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
