import { cn } from '~/utils'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import { useGameAdderStore } from './store'
import { useEffect, useState } from 'react'
import { ipcInvoke } from '~/utils'
import { useNavigate } from 'react-router-dom'

export function ScreenshotList(): JSX.Element {
  const {
    screenshotUrl,
    setScreenshotUrl,
    screenshotList,
    setScreenshotList,
    id,
    dataSource,
    setIsOpen,
    dbId,
    setDbId,
    setId,
    setName,
    setGameList,
    setIsLoading
  } = useGameAdderStore()

  const navigate = useNavigate()
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    toast.promise(
      (async (): Promise<string[]> => {
        const result = (await ipcInvoke('get-game-screenshots', dataSource, id)) as string[]
        if (result.length === 0) {
          toast.error('未找到游戏图片')
          setScreenshotUrl('')
          return []
        }
        setScreenshotUrl(result[0])
        setScreenshotList(result)
        return result
      })(),
      {
        loading: '获取图片中...',
        success: '获取图片成功',
        error: (err) => `获取图片失败: ${err.message}`
      }
    )
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const index = screenshotList.findIndex((image) => image === screenshotUrl)
      if (index === -1) return

      if (e.key === 'Enter') {
        addGameToDB()
        return
      }

      let targetIndex: number | null = null
      if (e.key === 'ArrowRight') targetIndex = index + 1
      else if (e.key === 'ArrowDown') targetIndex = index + 2
      else if (e.key === 'ArrowLeft') targetIndex = index - 1 + screenshotList.length
      else if (e.key === 'ArrowUp') targetIndex = index - 2 + screenshotList.length

      if (targetIndex !== null) {
        const targetGame = screenshotList[targetIndex % screenshotList.length]
        setScreenshotUrl(targetGame)
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
  }, [screenshotUrl, screenshotList])

  async function addGameToDB(): Promise<void> {
    if (isAdding) return
    setIsAdding(true)
    toast.promise(
      (async (): Promise<void> => {
        if (dbId) {
          await ipcInvoke('update-game-metadata', {
            dbId,
            dataSource,
            dataSourceId: id,
            screenshotUrl
          })
        } else {
          await ipcInvoke('add-game-to-db', {
            dataSource,
            id,
            preExistingDbId: dbId,
            screenshotUrl
          })
        }
        setIsAdding(false)
        setDbId('')
        setId('')
        setName('')
        setScreenshotList([])
        setScreenshotUrl('')
        setGameList([])
        setIsLoading(false)
        setIsOpen(false)
        navigate('/')
      })(),
      {
        loading: '添加游戏中...',
        success: '添加游戏成功',
        error: (err) => {
          setIsAdding(false)
          return `添加游戏失败: ${err.message}`
        }
      }
    )
  }
  return (
    <div className={cn('w-[100vh] h-[80vh] p-3')}>
      <div className={cn('flex flex-col w-full h-full gap-3')}>
        <div className="w-full h-full">
          <div className={cn('scrollbar-base overflow-auto pr-3')}>
            <div className={cn('grid grid-cols-2 gap-3 h-[72vh]')}>
              {screenshotList.length !== 0 ? (
                screenshotList.map((image) => (
                  <div
                    key={image}
                    data-image={image}
                    onClick={() => {
                      setScreenshotUrl(image)
                    }}
                    className={cn(
                      'cursor-pointer p-3 bg-muted text-muted-foreground rounded-lg',
                      image === screenshotUrl
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <img src={image} alt={image} className="w-full h-auto" />
                  </div>
                ))
              ) : (
                <div>暂无图片</div>
              )}
            </div>
          </div>
        </div>
        <div className={cn('flex flex-row-reverse')}>
          <Button onClick={addGameToDB}>确定</Button>
        </div>
      </div>
    </div>
  )
}
