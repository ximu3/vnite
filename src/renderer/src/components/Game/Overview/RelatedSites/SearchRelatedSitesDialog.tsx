import { cn } from '~/utils'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { GameRelatedSitesList } from '@appTypes/utils'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

interface SearchRelatedSitesDialogProps {
  isOpen: boolean
  onClose: () => void
  gameTitle: string
  onSelect: (relatedSites: { label: string; url: string }[]) => void
  initialRelatedSites?: { label: string; url: string }[]
}

export function SearchRelatedSitesDialog({
  isOpen,
  onClose,
  gameTitle,
  onSelect,
  initialRelatedSites = []
}: SearchRelatedSitesDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')
  const [searchTitle, setSearchTitle] = useState(gameTitle)
  const [relatedSitesList, setRelatedSitesList] = useState<GameRelatedSitesList>([])
  const [selectedRelatedSites, setSelectedRelatedSites] =
    useState<{ label: string; url: string }[]>(initialRelatedSites)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSearchTitle(gameTitle)
  }, [gameTitle])

  useEffect(() => {
    if (isOpen) {
      toast.promise(handleSearch(), {
        loading: t('detail.overview.relatedSites.search.loading'),
        success: t('detail.overview.relatedSites.search.success'),
        error: (err) => t('detail.overview.relatedSites.search.error', { message: err.message })
      })
    }
    setRelatedSitesList([])
  }, [isOpen, t])

  useEffect(() => {
    // Set initial selected related sites when dialog opens
    if (isOpen && initialRelatedSites) {
      setSelectedRelatedSites(initialRelatedSites)
    }
  }, [isOpen, initialRelatedSites])

  async function handleSearch(): Promise<void> {
    if (isLoading) return
    setIsLoading(true)

    try {
      const result = await ipcManager.invoke('scraper:get-game-related-sites-list', {
        type: 'name',
        value: searchTitle
      })

      if (!result || result.length === 0) {
        toast.error(t('detail.overview.relatedSites.search.notFound'))
        return
      }

      setRelatedSitesList(result)
    } catch (error) {
      toast.error(t('detail.overview.relatedSites.search.searchError', { error }))
    } finally {
      setIsLoading(false)
    }
  }

  function handleRelatedSiteToggle(label: string, url: string): void {
    setSelectedRelatedSites((prevSelected) => {
      const existingItem = prevSelected.find((item) => item.label === label && item.url === url)

      if (existingItem) {
        return prevSelected.filter((item) => !(item.label === label && item.url === url))
      } else {
        return [...prevSelected, { label, url }]
      }
    })
  }

  function handleConfirm(): void {
    onSelect(selectedRelatedSites)
    handleClose()
  }

  function handleClose(): void {
    setSelectedRelatedSites(initialRelatedSites)
    setSearchTitle(gameTitle)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className={cn('w-[50vw] h-[80vh] max-w-none flex flex-col gap-3')}
      >
        {/* Related Sites List */}
        <Card className={cn('p-3 w-full h-full scrollbar-base overflow-auto')}>
          {relatedSitesList.length > 0 ? (
            <div className="space-y-4">
              {relatedSitesList.map((source) => (
                <Card key={source.dataSource} className="rounded-lg p-4 shadow-xs">
                  <div className="">
                    <Badge className="">{source.dataSource}</Badge>
                  </div>
                  {source.relatedSites.map((site, index) => (
                    <div key={`${site.label}-${site.url}-${index}`} className="">
                      <div
                        className={cn(
                          'text-xs cursor-pointer rounded px-2 py-1 inline-block',
                          selectedRelatedSites.some(
                            (item) => item.label === site.label && item.url === site.url
                          )
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted'
                        )}
                        onClick={() => handleRelatedSiteToggle(site.label, site.url)}
                      >
                        <div className="font-medium">{site.label}</div>
                        <div className="text-muted-foreground text-xs break-all mt-1">
                          {site.url}
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('detail.overview.relatedSites.empty')}
            </div>
          )}
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
                  loading: t('detail.overview.relatedSites.search.loading'),
                  success: t('detail.overview.relatedSites.search.success'),
                  error: (err) =>
                    t('detail.overview.relatedSites.search.error', { message: err.message })
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
