import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { GameImage } from '@ui/game-image'
import { Button } from '@ui/button'
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'
import { useState } from 'react'
import { UrlDialog } from './UrlDialog'
import { CropDialog } from './CropDialog'

export function Media({ gameId }: { gameId: string }): JSX.Element {
  const [mediaUrl, setMediaUrl] = useState<string>('')
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState({
    icon: false,
    cover: false,
    background: false
  })

  const [cropDialogState, setCropDialogState] = useState<{
    isOpen: boolean
    type: string
    imagePath: string | null
    isResizing: boolean
  }>({
    isOpen: false,
    type: '',
    imagePath: null,
    isResizing: false
  })

  // Processing file selection
  async function handleFileSelect(type: string): Promise<void> {
    try {
      const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
      if (!filePath) return
      if (filePath.endsWith('.exe') && type == 'icon') {
        await ipcInvoke('set-game-media', gameId, type, filePath)
        return
      }
      setCropDialogState({
        isOpen: true,
        type,
        imagePath: filePath,
        isResizing: false
      })
    } catch (error) {
      toast.error(`选择文件失败: ${error}`)
    }
  }

  // Handling of resizing
  async function handleResize(type: string): Promise<void> {
    try {
      // Get current image path
      const currentPath: string = await ipcInvoke('get-game-media-path', gameId, type)
      if (!currentPath) {
        toast.error('未找到当前图片')
        return
      }

      setCropDialogState({
        isOpen: true,
        type,
        imagePath: currentPath,
        isResizing: true
      })
    } catch (error) {
      toast.error(`获取当前图片失败: ${error}`)
    }
  }

  // Processing URL Input
  function setMediaWithUrl(type: string): void {
    toast.promise(
      async () => {
        setIsUrlDialogOpen({ ...isUrlDialogOpen, [type]: false })
        if (!mediaUrl.trim()) return
        const tempFilePath = await ipcInvoke('download-temp-image', mediaUrl)
        setCropDialogState({
          isOpen: true,
          type,
          imagePath: tempFilePath as string,
          isResizing: false
        })
        setMediaUrl('')
      },
      {
        loading: `正在获取图片...`,
        success: `图片获取成功`,
        error: (err) => `图片获取失败: ${err.message}`
      }
    )
  }

  // Processing cuts are complete
  async function handleCropComplete(type: string, filePath: string): Promise<void> {
    setCropDialogState({ isOpen: false, type: '', imagePath: null, isResizing: false })

    toast.promise(
      async () => {
        await ipcInvoke('set-game-media', gameId, type, filePath)
      },
      {
        loading: `正在${cropDialogState.isResizing ? '调整' : '设置'}${type}...`,
        success: `${type}${cropDialogState.isResizing ? '调整' : '设置'}成功`,
        error: (err) => `${type}${cropDialogState.isResizing ? '调整' : '设置'}失败: ${err.message}`
      }
    )
  }

  // Media Control Button Component
  const MediaControls = ({ type }: { type: string }): JSX.Element => (
    <div className={cn('flex flex-row gap-2')}>
      <Button
        onClick={() => handleFileSelect(type)}
        variant={'outline'}
        size={'icon'}
        className={cn('w-7 h-7')}
      >
        <span className={cn('icon-[mdi--file-outline] w-4 h-4')}></span>
      </Button>
      <UrlDialog
        mediaUrl={mediaUrl}
        setMediaUrl={setMediaUrl}
        setMediaWithUrl={setMediaWithUrl}
        isUrlDialogOpen={isUrlDialogOpen}
        setIsUrlDialogOpen={setIsUrlDialogOpen}
        type={type}
      />
      <Button
        onClick={() => handleResize(type)}
        variant={'outline'}
        size={'icon'}
        className={cn('w-7 h-7')}
      >
        <span className={cn('icon-[mdi--resize] w-4 h-4')}></span>
      </Button>
    </div>
  )

  return (
    <div className={cn('flex flex-row gap-3 w-full')}>
      <div className={cn('flex flex-col gap-3 w-full')}>
        <Card>
          <CardHeader>
            <CardTitle>图标</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <MediaControls type="icon" />
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
              <MediaControls type="background" />
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
              <MediaControls type="cover" />
              <div className={cn('self-center')}>
                <GameImage
                  gameId={gameId}
                  type="cover"
                  className={cn('max-h-[170px] h-[calc(90vh-230px)] aspect-[2/3] object-cover')}
                  fallback={<div>暂无封面</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>徽标</CardTitle>
          </CardHeader>
          <CardContent className={cn('-mt-2')}>
            <div className={cn('flex flex-col gap-2')}>
              <MediaControls type="logo" />
              <div className={cn('self-center')}>
                <GameImage
                  gameId={gameId}
                  type="logo"
                  className={cn('max-h-[158px] h-[calc(90vh-230px)] aspect-[2/3] object-contain')}
                  fallback={<div>暂无徽标</div>}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CropDialog
        isOpen={cropDialogState.isOpen}
        onClose={() =>
          setCropDialogState({ isOpen: false, type: '', imagePath: null, isResizing: false })
        }
        imagePath={cropDialogState.imagePath}
        onCropComplete={(filePath) => handleCropComplete(cropDialogState.type, filePath)}
      />
    </div>
  )
}
