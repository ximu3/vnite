import { cn } from '~/utils'
import { Dialog, DialogContent } from '@ui/dialog'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup
} from '@ui/select'
import { Card } from '@ui/card'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ipcInvoke } from '~/utils'

interface SearchMediaDialogProps {
  isOpen: boolean
  onClose: () => void
  type: string
  gameTitle: string
  onSelect: (imagePath: string) => void
}

export function SearchMediaDialog({
  isOpen,
  onClose,
  type,
  gameTitle,
  onSelect
}: SearchMediaDialogProps): JSX.Element {
  const [searchTitle, setSearchTitle] = useState(gameTitle)
  const [dataSource, setDataSource] = useState('steamGridDb')
  const [imageList, setImageList] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      toast.promise(handleSearch(), {
        loading: '搜索中...',
        success: '搜索成功',
        error: (err) => `搜索失败: ${err.message}`
      })
    }
  }, [isOpen])

  async function handleSearch(): Promise<void> {
    if (isLoading) return
    setIsLoading(true)

    try {
      let result: string[] = []
      switch (type) {
        case 'cover':
          result = await ipcInvoke('get-game-covers-by-title', dataSource, searchTitle)
          break
        case 'icon':
          result = await ipcInvoke('get-game-icons-by-title', dataSource, searchTitle)
          break
        case 'logo':
          result = await ipcInvoke('get-game-logos-by-title', dataSource, searchTitle)
          break
        case 'background':
          result = await ipcInvoke('get-game-screenshots-by-title', dataSource, searchTitle)
          break
      }

      if (result.length === 0) {
        toast.error('未找到相关图片')
        return
      }

      setImageList(result)
      setSelectedImage(result[0])
    } catch (error) {
      toast.error(`搜索失败: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  function handleConfirm(): void {
    if (!selectedImage) {
      toast.error('请选择一张图片')
      return
    }
    onSelect(selectedImage)
    onClose()
  }

  function handleClose(): void {
    setSelectedImage('')
    setImageList([])
    setDataSource('steamGridDb')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className={cn('w-[50vw] h-[80vh] max-w-none flex flex-col gap-3')}
      >
        <Card className={cn('p-3 w-full h-full')}>
          <div className="w-full h-full">
            <div className={cn('w-full h-full scrollbar-base overflow-auto')}>
              <div className={cn('grid grid-cols-2 gap-3 h-[62vh]')}>
                {imageList.length > 0 ? (
                  imageList.map((image) => (
                    <div
                      key={image}
                      onClick={() => setSelectedImage(image)}
                      className={cn(
                        'cursor-pointer p-3 bg-muted text-muted-foreground rounded-lg',
                        image === selectedImage
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
        </Card>
        <Card className={cn('p-3')}>
          <div className={cn('flex flex-row gap-3')}>
            <Select value={dataSource} onValueChange={setDataSource}>
              <SelectTrigger className={cn('w-72')}>
                <SelectValue placeholder="选择数据源" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>数据源</SelectLabel>
                  <SelectItem value="steamGridDb">SteamGridDB</SelectItem>
                  {['cover', 'background'].includes(type) && (
                    <SelectItem value="steam">Steam</SelectItem>
                  )}
                  {['cover', 'background'].includes(type) && (
                    <SelectItem value="vndb">VNDB</SelectItem>
                  )}
                  {['cover'].includes(type) && <SelectItem value="bangumi">Bangumi</SelectItem>}
                  {['cover', 'background'].includes(type) && (
                    <SelectItem value="igdb">IGDB</SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="搜索标题"
              className={cn('')}
            />
            <Button
              onClick={() => {
                toast.promise(handleSearch(), {
                  loading: '搜索中...',
                  success: '搜索成功',
                  error: (err) => `搜索失败: ${err.message}`
                })
              }}
              size={'icon'}
              className={cn('shrink-0')}
              disabled={isLoading}
            >
              <span className={cn('icon-[mdi--magnify] w-[20px] h-[20px]')}></span>
            </Button>
            <Button onClick={handleConfirm}>确定</Button>
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
