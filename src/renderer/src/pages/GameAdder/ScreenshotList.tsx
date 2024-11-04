import { cn } from '~/utils'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import { useGameAdderStore } from './store'
import { useEffect } from 'react'
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
    setDataSource,
    setDbId,
    setId,
    setName,
    setGameList,
    setIsLoading
  } = useGameAdderStore()

  const navigate = useNavigate()

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

  async function addGameToDB(): Promise<void> {
    toast.promise(
      (async (): Promise<void> => {
        await ipcInvoke('add-game-to-db', dataSource, id, screenshotUrl)
        setIsOpen(false)
        setDataSource('vndb')
        setDbId('')
        setId('')
        setName('')
        setScreenshotList([])
        setScreenshotUrl('')
        setGameList([])
        setIsLoading(false)
        navigate('/')
      })(),
      {
        loading: '添加游戏中...',
        success: '添加游戏成功',
        error: (err) => `添加游戏失败: ${err.message}`
      }
    )
  }
  return (
    <div className={cn('w-[100vh] h-[80vh] p-3')}>
      <div className={cn('flex flex-col w-full h-full gap-3')}>
        <div className="w-full h-full">
          <div className={cn('scrollbar-base overflow-auto pr-3')}>
            <div className={cn('grid grid-cols-2 gap-3 h-[630px]', '3xl:h-[790px]')}>
              {screenshotList.length !== 0 ? (
                screenshotList.map((image) => (
                  <div
                    key={image}
                    onClick={() => {
                      setScreenshotUrl(image)
                      toast.success(`已选择图片: ${image}`)
                    }}
                    className={cn(
                      'cursor-pointer p-3 bg-muted text-muted-foreground rounded-[0.3rem]',
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
