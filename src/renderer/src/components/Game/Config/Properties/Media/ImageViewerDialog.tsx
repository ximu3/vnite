import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { cn } from '~/utils'

interface ImageViewerDialogProps {
  isOpen: boolean
  imagePath: string | null
  onClose: () => void
}

export function ImageViewerDialog({
  isOpen,
  imagePath,
  onClose
}: ImageViewerDialogProps): React.JSX.Element | null {
  const { t } = useTranslation('game')
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastTranslate = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  })

  useEffect(() => {
    if (!isOpen) return
    // Reset state on open
    setScale(1)
    setTranslate({ x: 0, y: 0 })
    lastTranslate.current = { x: 0, y: 0 }
  }, [isOpen])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY
      const zoomIntensity = 0.1
      const newScale = Math.max(
        0.1,
        Math.min(10, scale * (delta > 0 ? 1 - zoomIntensity : 1 + zoomIntensity))
      )

      // Zoom to cursor position
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const cx = e.clientX - rect.left - rect.width / 2 - translate.x
        const cy = e.clientY - rect.top - rect.height / 2 - translate.y
        const ratio = newScale / scale
        setTranslate({ x: translate.x - cx * (ratio - 1), y: translate.y - cy * (ratio - 1) })
      }

      setScale(newScale)
    },
    [scale, translate]
  )

  const onMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY }
    lastTranslate.current = { ...translate }
  }

  const onMouseMove = (e: React.MouseEvent): void => {
    if (!isPanning) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setTranslate({ x: lastTranslate.current.x + dx, y: lastTranslate.current.y + dy })
  }

  const onMouseUp = (): void => {
    setIsPanning(false)
  }

  const getFitScale = (): number => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img) return 1

    const cw = container.clientWidth
    const ch = container.clientHeight
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    return Math.min(cw / iw, ch / ih)
  }

  const fitToScreen = (): void => {
    const scaleFit = getFitScale() as number
    if (!scaleFit) return
    setScale(scaleFit)
    setTranslate({ x: 0, y: 0 })
    lastTranslate.current = { x: 0, y: 0 }
  }

  const reset = (): void => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
    lastTranslate.current = { x: 0, y: 0 }
  }

  const zoomIn = (): void => setScale((s) => Math.min(10, s * 1.2))
  const zoomOut = (): void => setScale((s) => Math.max(0.1, s / 1.2))

  const title = useMemo(() => t('detail.properties.media.actions.viewLargeImage'), [t])

  // Handle image load to capture natural size
  const onImageLoad = (): void => {
    if (!imgRef.current) return
    setNaturalSize({ width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight })
  }

  // Keyboard shortcuts: + to zoom in, - to zoom out, 0 to reset, f to fit
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent): void => {
      const key = e.key.toLowerCase()
      if (
        ['+', '-', '=', '0', 'f', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)
      ) {
        e.preventDefault()
      }
      if (key === '+' || key === '=') {
        setScale((s) => Math.min(10, s * 1.2))
      } else if (key === '-') {
        setScale((s) => Math.max(0.1, s / 1.2))
      } else if (key === '0') {
        reset()
      } else if (key === 'f') {
        fitToScreen()
      } else if (key === 'arrowup') {
        setTranslate((tr) => ({ ...tr, y: tr.y + 50 }))
      } else if (key === 'arrowdown') {
        setTranslate((tr) => ({ ...tr, y: tr.y - 50 }))
      } else if (key === 'arrowleft') {
        setTranslate((tr) => ({ ...tr, x: tr.x + 50 }))
      } else if (key === 'arrowright') {
        setTranslate((tr) => ({ ...tr, x: tr.x - 50 }))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  // Double click: toggle between 100% and fit-to-screen
  const onDoubleClick = (): void => {
    const fit = getFitScale()
    if (!fit) return
    const near1 = Math.abs(scale - 1) < 0.02
    if (near1) {
      // Switch to fit-to-screen
      setScale(fit)
    } else {
      // Switch to 100%
      setScale(1)
    }
    setTranslate({ x: 0, y: 0 })
    lastTranslate.current = { x: 0, y: 0 }
  }

  // Copy current original image to clipboard
  const copyImageToClipboard = (): void => {
    if (!imagePath) return
    ipcManager
      .invoke('utils:write-clipboard-image', imagePath, 'path')
      .then(() => {
        toast.success(t('utils:clipboard.copied'), { duration: 1000 })
      })
      .catch((error) => {
        toast.error(t('utils:clipboard.copyError', { error }))
      })
  }

  // Save current original image as file
  const saveImageAs = (): void => {
    if (!imagePath) return
    ipcManager
      .invoke('system:save-image-as-file-dialog', imagePath)
      .then((success: boolean) => {
        if (success) toast.success(t('utils:saveFile.success'), { duration: 1000 })
      })
      .catch((error) => {
        toast.error(t('utils:saveFile.error', { error }))
      })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn('w-[80vw] h-[80vh] max-w-none p-0 overflow-hidden flex flex-col gap-0')}
      >
        <DialogHeader className={cn('px-4 pt-4 pb-2')}>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          className={cn('px-4 pb-4 flex items-center gap-3 justify-between')}
          onMouseLeave={onMouseUp}
        >
          <div className={cn('flex items-center gap-2')}>
            <Button size="sm" variant="outline" onClick={zoomOut}>
              <span className={cn('icon-[mdi--magnify-minus-outline] w-4 h-4')}></span>
            </Button>
            <Button size="sm" variant="outline" onClick={zoomIn}>
              <span className={cn('icon-[mdi--magnify-plus-outline] w-4 h-4')}></span>
            </Button>
            <Button size="sm" variant="outline" onClick={fitToScreen}>
              <span className={cn('icon-[mdi--fit-to-screen-outline] w-4 h-4')}></span>
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              <span className={cn('icon-[mdi--refresh] w-4 h-4')}></span>
            </Button>
          </div>
          <div className={cn('flex items-center gap-2')}>
            <Button size="sm" variant="outline" onClick={copyImageToClipboard}>
              {t('detail.memory.export.toClipboard')}
            </Button>
            <Button size="sm" variant="outline" onClick={saveImageAs}>
              {t('detail.memory.export.saveAs')}
            </Button>
          </div>
          <div
            className={cn('text-xs text-muted-foreground shrink-0')}
            title={`${naturalSize.width}×${naturalSize.height} px`}
          >
            {naturalSize.width > 0 && naturalSize.height > 0
              ? `${naturalSize.width}×${naturalSize.height} · ${Math.round(scale * 100)}%`
              : `${Math.round(scale * 100)}%`}
          </div>
        </div>
        <div
          ref={containerRef}
          className={cn(
            'flex-1 bg-background/50 overflow-hidden relative cursor-grab active:cursor-grabbing'
          )}
          onWheel={handleWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onDoubleClick={onDoubleClick}
        >
          {imagePath ? (
            <div className={cn('absolute inset-0 flex items-center justify-center')}>
              <img
                ref={imgRef}
                src={`file://${imagePath}`}
                className={cn('select-none pointer-events-none')}
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
                onLoad={onImageLoad}
              />
            </div>
          ) : (
            <div
              className={cn('w-full h-full flex items-center justify-center text-muted-foreground')}
            >
              {t('detail.properties.media.empty.images')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
