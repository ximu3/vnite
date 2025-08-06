import { cn } from '~/utils'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import parse from 'html-react-parser'
import { HTMLParserOptions } from '~/utils'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

interface SearchDescriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  gameTitle: string
  onSelect: (description: string) => void
}

export function SearchDescriptionDialog({
  isOpen,
  onClose,
  gameTitle,
  onSelect
}: SearchDescriptionDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')
  const [searchTitle, setSearchTitle] = useState(gameTitle)
  const [descriptionList, setDescriptionList] = useState<
    { dataSource: string; description: string }[]
  >([])
  const [selectedDescription, setSelectedDescription] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSearchTitle(gameTitle)
  }, [gameTitle])

  useEffect(() => {
    if (isOpen) {
      toast.promise(handleSearch(), {
        loading: t('detail.overview.description.search.loading'),
        success: t('detail.overview.description.search.success'),
        error: (err) => t('detail.overview.description.search.error', { message: err.message })
      })
    }
    setDescriptionList([])
  }, [isOpen, t])

  async function handleSearch(): Promise<void> {
    if (isLoading) return
    setIsLoading(true)

    try {
      const result = await ipcManager.invoke('scraper:get-game-description-list', {
        type: 'name',
        value: searchTitle
      })

      if (result.length === 0) {
        toast.error(t('detail.overview.description.search.notFound'))
        return
      }

      setDescriptionList(result)
      setSelectedDescription(result[0].description)
    } catch (error) {
      toast.error(t('detail.overview.description.search.searchError', { error }))
    } finally {
      setIsLoading(false)
    }
  }

  function handleConfirm(): void {
    if (!selectedDescription) {
      toast.error(t('detail.overview.description.search.selectRequired'))
      return
    }
    onSelect(selectedDescription)
    handleClose()
  }

  function handleClose(): void {
    setSelectedDescription('')
    setDescriptionList([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className={cn('w-[50vw] h-[80vh] max-w-none flex flex-col gap-3')}
      >
        {/* Description List */}
        <Card className={cn('p-3 w-full h-full')}>
          <div className="w-full h-full">
            <div className={cn('w-full h-full scrollbar-base overflow-auto')}>
              <div className={cn('flex flex-col gap-3 h-[62vh]')}>
                {descriptionList.length > 0 ? (
                  descriptionList.map((item, index) => (
                    <Card
                      key={index}
                      onClick={() => setSelectedDescription(item.description)}
                      className={cn(
                        'cursor-pointer p-4 rounded-lg shadow-xs relative transition-colors',
                        item.description === selectedDescription
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'text-sm',
                          'prose-a:text-primary', // Link Color
                          'prose-a:no-underline hover:prose-a:underline', // underline effect
                          'space-before-0',
                          'whitespace-pre-line',
                          'break-words',
                          'leading-7'
                        )}
                      >
                        {parse(item.description, HTMLParserOptions)}
                      </div>
                      <Badge className="absolute bottom-2 right-2">{item.dataSource}</Badge>
                    </Card>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {t('detail.overview.description.empty')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Search and Action Buttons */}
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
                  loading: t('detail.overview.description.search.loading'),
                  success: t('detail.overview.description.search.success'),
                  error: (err) =>
                    t('detail.overview.description.search.error', { message: err.message })
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
