import { cn } from '~/utils'
import { useGameMedia } from '~/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'
import { useState } from 'react'
import { UrlDialog } from './UrlDialog'

export function Media({ gameId }: { gameId: string }): JSX.Element {
  const { mediaUrl: icon, refreshMedia: refreshIcon } = useGameMedia({
    gameId: gameId,
    type: 'icon'
  })
  const { mediaUrl: cover, refreshMedia: refreshCover } = useGameMedia({
    gameId: gameId,
    type: 'cover'
  })
  const { mediaUrl: background, refreshMedia: refreshBackground } = useGameMedia({
    gameId: gameId,
    type: 'background'
  })
  const [mediaUrl, setMediaUrl] = useState<string>('')
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState({
    icon: false,
    cover: false,
    background: false
  })
  async function setMediaWithFile(type: string): Promise<void> {
    const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    toast.promise(
      async () => {
        await ipcInvoke('set-game-media', gameId, type, filePath)
        switch (type) {
          case 'icon':
            await refreshIcon()
            break
          case 'cover':
            await refreshCover()
            break
          case 'background':
            await refreshBackground()
            break
        }
      },
      {
        loading: `正在设置 ${type}...`,
        success: `${type} 设置成功`,
        error: (err) => `${type} 设置失败: ${err.message}`
      }
    )
  }
  async function setMediaWithUrl(type: string): Promise<void> {
    setIsUrlDialogOpen({ ...isUrlDialogOpen, [type]: false })
    toast.promise(
      async () => {
        await ipcInvoke('set-game-media', gameId, type, mediaUrl)
        switch (type) {
          case 'icon':
            await refreshIcon()
            break
          case 'cover':
            await refreshCover()
            break
          case 'background':
            await refreshBackground()
            break
        }
      },
      {
        loading: `正在设置 ${type}...`,
        success: `${type} 设置成功`,
        error: (err) => `${type} 设置失败: ${err.message}`
      }
    )
    setMediaUrl('')
  }

  return (
    <div className={cn('flex flex-row gap-3 w-full')}>
      <div className={cn('flex flex-col gap-3 w-full')}>
        <Card>
          <CardHeader>
            <CardTitle>图标</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <div className={cn('flex flex-row gap-2')}>
                <Button
                  onClick={() => {
                    setMediaWithFile('icon')
                  }}
                  variant={'outline'}
                  size={'icon'}
                  className={cn('w-7 h-7')}
                >
                  <span className={cn('icon-[mdi--file-outline] w-4 h-4')}></span>
                </Button>
                <UrlDialog
                  {...{
                    mediaUrl,
                    setMediaUrl,
                    setMediaWithUrl,
                    isUrlDialogOpen,
                    setIsUrlDialogOpen,
                    type: 'icon'
                  }}
                />
              </div>
              <div className={cn('self-center')}>
                {icon ? (
                  <img src={icon} alt="icon" className={cn('w-16 h-16 object-cover')} />
                ) : (
                  <div>暂无图标</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>背景</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <div className={cn('flex flex-row gap-2')}>
                <Button
                  variant={'outline'}
                  size={'icon'}
                  className={cn('w-7 h-7')}
                  onClick={() => {
                    setMediaWithFile('background')
                  }}
                >
                  <span className={cn('icon-[mdi--file-outline] w-4 h-4')}></span>
                </Button>
                <UrlDialog
                  {...{
                    mediaUrl,
                    setMediaUrl,
                    setMediaWithUrl,
                    isUrlDialogOpen,
                    setIsUrlDialogOpen,
                    type: 'background'
                  }}
                />
              </div>
              <div className={cn('self-center')}>
                <img
                  src={background}
                  alt="background"
                  className={cn('w-[500px] h-[264px] object-cover')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className={cn('flex flex-col gap-3 w-full')}>
        <Card>
          <CardHeader>
            <CardTitle>封面</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <div className={cn('flex flex-row gap-2')}>
                <Button
                  variant={'outline'}
                  size={'icon'}
                  className={cn('w-7 h-7')}
                  onClick={() => {
                    setMediaWithFile('cover')
                  }}
                >
                  <span className={cn('icon-[mdi--file-outline] w-4 h-4')}></span>
                </Button>
                <UrlDialog
                  {...{
                    mediaUrl,
                    setMediaUrl,
                    setMediaWithUrl,
                    isUrlDialogOpen,
                    setIsUrlDialogOpen,
                    type: 'cover'
                  }}
                />
              </div>
              <div className={cn('self-center')}>
                <img src={cover} alt="cover" className={cn('w-[300px] h-[458px] object-cover')} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
