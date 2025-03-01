import React from 'react'
import { ImgHTMLAttributes } from 'react'
import { useAttachmentStore } from '~/stores'
import { cn } from '~/utils'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import type { Effect } from 'react-lazy-load-image-component' // 导入Effect类型
import 'react-lazy-load-image-component/src/effects/blur.css'

interface GameImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  gameId: string
  type: 'background' | 'cover' | 'icon' | 'logo' | string
  onUpdated?: () => void
  fallback?: React.ReactNode
  shadow?: boolean
  flips?: boolean
  effect?: Effect // 修正：使用正确的Effect类型
}

export const GameImage: React.FC<GameImageProps> = ({
  gameId,
  type,
  className,
  onError,
  onUpdated,
  fallback = <div>暂无图标</div>,
  shadow = false,
  flips = false,
  effect = 'blur' as Effect, // 修正：使用类型断言
  ...imgProps
}) => {
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()

  const attachmentInfo = getAttachmentInfo('game', gameId, `images/${type}.webp`)

  // 直接使用附件协议URL
  const attachmentUrl = `attachment://game/${gameId}/images/${type}.webp?t=${
    attachmentInfo?.timestamp
  }`

  // 如果已知图片有错误，直接返回fallback
  if (attachmentInfo?.error) {
    return <>{fallback}</>
  }

  // 定义自定义占位符，保持与原组件行为一致
  const placeholder = (
    <div className={cn('w-full h-full', className?.includes('rounded') && 'rounded-lg')}>
      {/* 这里可以添加loading指示器 */}
    </div>
  )

  return (
    <div className={cn('relative', className)}>
      <LazyLoadImage
        src={attachmentUrl}
        effect={effect}
        placeholder={placeholder}
        wrapperClassName={cn('w-full h-full')}
        className={cn(
          'transition-opacity duration-300',
          shadow && 'shadow-md shadow-black/50',
          flips && '-scale-y-100',
          className
        )}
        onLoad={() => {
          onUpdated?.()
        }}
        onError={(e) => {
          setAttachmentError('game', gameId, `images/${type}.webp`, true)
          onError?.(e)
        }}
        threshold={100} // 提前100px开始加载
        wrapperProps={{
          style: {
            display: 'block',
            width: '100%',
            height: '100%'
          }
        }}
        {...imgProps}
      />

      {/* 错误回退方案 - 在LazyLoadImage内部onError处理失败的情况下生效 */}
      <noscript>{fallback}</noscript>
    </div>
  )
}
