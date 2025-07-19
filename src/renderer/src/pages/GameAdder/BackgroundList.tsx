import { cn } from '~/utils'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import { useGameAdderStore } from './store'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameMetadataUpdaterStore } from '../GameMetadataUpdater/store'
import { ipcManager } from '~/app/ipc'

export function BackgroundList(): React.JSX.Element {
  const { t } = useTranslation('adder')
  const {
    backgroundUrl,
    setBackgroundUrl,
    backgroundList,
    setBackgroundList,
    dataSourceId,
    dataSource,
    dbId,
    dirPath,
    handleClose
  } = useGameAdderStore()

  const {
    setIsOpen: setIsGameMetadataUpdaterDialogOpen,
    setBackgroundUrl: setGameMetadataUpdaterBackgroundUrl,
    setDataSource: setGameMetadataUpdaterDataSource,
    setDataSourceId: setGameMetadataUpdaterDataSourceId,
    setGameIds: setGameMetadataUpdaterGameIds
  } = useGameMetadataUpdaterStore()

  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const fetchBackgrounds = async (): Promise<void> => {
      try {
        toast.loading(t('gameAdder.backgrounds.notifications.loading'), {
          id: 'loading-backgrounds'
        })
        const result = await ipcManager.invoke('scraper:get-game-backgrounds', dataSource, {
          type: 'id',
          value: dataSourceId
        })
        if (result.length === 0) {
          toast.error(t('gameAdder.backgrounds.notifications.noImages'))
          setBackgroundUrl('')
          return
        }
        setBackgroundUrl(result[0])
        setBackgroundList(result)
        toast.success(t('gameAdder.backgrounds.notifications.success'), {
          id: 'loading-backgrounds'
        })
      } catch (error) {
        toast.error(t('gameAdder.backgrounds.notifications.error', { message: String(error) }), {
          id: 'loading-backgrounds'
        })
      }
    }
    fetchBackgrounds()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const index = backgroundList.findIndex((image) => image === backgroundUrl)
      if (index === -1) return

      if (e.key === 'Enter') {
        addGameToDB()
        return
      }

      let targetIndex: number | null = null
      if (e.key === 'ArrowRight') targetIndex = index + 1
      else if (e.key === 'ArrowDown') targetIndex = index + 2
      else if (e.key === 'ArrowLeft') targetIndex = index - 1 + backgroundList.length
      else if (e.key === 'ArrowUp') targetIndex = index - 2 + backgroundList.length

      if (targetIndex !== null) {
        const targetGame = backgroundList[targetIndex % backgroundList.length]
        setBackgroundUrl(targetGame)
        const targetElement = document.querySelector(`[data-image="${targetGame}"]`)
        targetElement?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [backgroundUrl, backgroundList])

  async function addGameToDB(): Promise<void> {
    if (isAdding) return
    setIsAdding(true)
    try {
      if (dbId) {
        setGameMetadataUpdaterBackgroundUrl(backgroundUrl)
        setGameMetadataUpdaterDataSource(dataSource)
        setGameMetadataUpdaterGameIds([dbId])
        setIsGameMetadataUpdaterDialogOpen(true)
        setIsAdding(false)
        setGameMetadataUpdaterDataSourceId(dataSourceId)
        setIsAdding(false)
        handleClose()
        return
      } else {
        toast.loading(t('gameAdder.backgrounds.notifications.adding'), {
          id: 'adding-game'
        })
        await ipcManager.invoke('adder:add-game-to-db', {
          dataSource,
          dataSourceId,
          backgroundUrl,
          dirPath
        })
        setIsAdding(false)
        handleClose()
        toast.success(t('gameAdder.backgrounds.notifications.addSuccess'), {
          id: 'adding-game'
        })
        return
      }
    } catch (error) {
      setIsAdding(false)
      toast.error(t('gameAdder.backgrounds.notifications.addError', { message: String(error) }), {
        id: 'adding-game'
      })
    }
  }

  return (
    <div className={cn('w-[100vh] h-[83vh] p-3')}>
      <div className={cn('flex flex-col w-full h-full gap-3')}>
        <div className={cn('font-bold')}>{t('gameAdder.backgrounds.title')}</div>
        <div className="w-full h-full">
          <div className={cn('scrollbar-base overflow-auto pr-3')}>
            <div className={cn('grid grid-cols-2 gap-3 h-[72vh]')}>
              {backgroundList.length !== 0 ? (
                backgroundList.map((image) => (
                  <div
                    key={image}
                    data-image={image}
                    onClick={() => {
                      setBackgroundUrl(image)
                    }}
                    className={cn(
                      'cursor-pointer p-3 bg-muted text-muted-foreground rounded-lg',
                      image === backgroundUrl
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <img src={image} alt={image} className="w-full h-auto" />
                  </div>
                ))
              ) : (
                <div>{t('gameAdder.backgrounds.noImages')}</div>
              )}
            </div>
          </div>
        </div>
        <div className={cn('flex flex-row-reverse')}>
          <Button onClick={addGameToDB}>{t('utils:common.confirm')}</Button>
        </div>
      </div>
    </div>
  )
}
