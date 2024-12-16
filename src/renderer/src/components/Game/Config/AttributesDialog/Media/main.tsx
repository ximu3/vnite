import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { GameImage } from '@ui/game-image'
import { Button } from '@ui/button'
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'
import { useState } from 'react'
import { UrlDialog } from './UrlDialog'

export function Media({ gameId }: { gameId: string }): JSX.Element {
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
                <GameImage
                  gameId={gameId}
                  type="icon"
                  className={cn('max-h-16 h-[calc(30vh-160px)] aspect-[1] object-cover')}
                  fallback={<div>暂无图标</div>}
                />
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
                <GameImage
                  gameId={gameId}
                  type="background"
                  className={cn('max-h-[264px] h-[calc(60vh-200px)] aspect-[2] object-cover')}
                  fallback={<div>暂无背景</div>}
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
                <GameImage
                  gameId={gameId}
                  type="cover"
                  className={cn('max-h-[458px] h-[calc(90vh-230px)] aspect-[2/3] object-cover')}
                  fallback={<div>暂无封面</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
