import { generateUUID } from '@appUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfigState } from '~/hooks'
import { cn, ipcInvoke } from '~/utils'
import { useGameAdderStore } from './GameAdder/store'
import { useGameBatchAdderStore } from './GameBatchAdder/store'

export function DragContainer({ children }: { children: React.ReactNode }): JSX.Element {
  const { t } = useTranslation('sidebar')
  const [isDragging, setIsDragging] = useState(false)
  const { setIsOpen: setGameAdderIsOpen, setName, setDirPath } = useGameAdderStore()
  const { actions: gameBatchAdderActions } = useGameBatchAdderStore()
  const [defaultDataSource] = useConfigState('game.scraper.common.defaultDataSource')

  const isFileDrag = (event: DragEvent): boolean => {
    if (!event.dataTransfer) return false

    const types = Array.from(event.dataTransfer.types)
    // `types.includes('Files')` doesn't work when dragging img element
    if (types.length === 1 && types[0] === 'Files') {
      return true
    }

    return false
  }

  useEffect(() => {
    const handleDragEnter = (event: DragEvent): void => {
      event.preventDefault()
      event.stopPropagation()
      if (!isFileDrag(event)) return
      setIsDragging(true)
    }
    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault()
      event.stopPropagation()
      if (!isFileDrag(event)) return
      setIsDragging(true)
    }
    const handleDragLeave = (event: DragEvent): void => {
      event.preventDefault()
      event.stopPropagation()
      if (!isFileDrag(event)) return
      setIsDragging(false)
    }
    const handleDrop = async (event: DragEvent): Promise<void> => {
      event.preventDefault()
      event.stopPropagation()
      if (!isFileDrag(event)) return
      setIsDragging(false)

      const paths = event.dataTransfer?.files
        ? Array.from(event.dataTransfer.files).map((file) =>
            window.api.webUtils.getPathForFile(file)
          )
        : []

      const gameInfo: {
        name: string
        dirPath: string
      }[] = []

      paths.forEach((path) => {
        const isDirectory = window.api.webUtils.isDirectory(path)
        if (isDirectory) {
          gameInfo.push({
            name: window.api.path.basename(path),
            dirPath: path
          })
        } else {
          const dirPath = window.api.path.dirname(path)
          const name = window.api.path.basename(dirPath)
          gameInfo.push({
            name,
            dirPath
          })
        }
      })

      if (gameInfo.length > 1) {
        toast.loading(t('notifications.gettingBatchGames'), {
          id: 'getting-batch-games'
        })
        const games = gameInfo.map(async (info) => ({
          dataId: generateUUID(),
          name: info.name,
          dataSource: defaultDataSource,
          id: '',
          status: (await ipcInvoke('check-game-exits-by-path', info.dirPath))
            ? 'existed'
            : ('idle' as 'existed' | 'idle'),
          dirPath: info.dirPath
        }))
        gameBatchAdderActions.setGames(await Promise.all(games))
        gameBatchAdderActions.setIsOpen(true)
        toast.success(t('notifications.getBatchGamesSuccess'), {
          id: 'getting-batch-games'
        })
      } else {
        setName(gameInfo[0].name)
        setDirPath(gameInfo[0].dirPath)
        setGameAdderIsOpen(true)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)

    return (): void => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  return (
    <div className={cn('flex flex-row w-screen h-screen relative')}>
      <div
        className={cn(
          'absolute top-0 left-0 w-full h-full bg-black/80 transition-opacity duration-300 z-[999] pointer-events-none',
          isDragging ? 'opacity-100' : 'opacity-0'
        )}
      ></div>
      {children}
    </div>
  )
}
