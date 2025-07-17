import { useTransition, animated, easings } from '@react-spring/web'

interface CrossfadeImageProps {
  src: string
  alt?: string
  className?: string
  duration?: number
  onError?: () => void
  blur?: boolean // 新增模糊选项
  style?: React.CSSProperties // 允许传入自定义样式
}

export function CrossfadeImage({
  src,
  alt = '',
  className = '',
  duration = 300,
  onError = () => {},
  blur = false, // 默认不模糊
  style = {}
}: CrossfadeImageProps): React.JSX.Element {
  // 创建图片切换的过渡动画
  const transitions = useTransition(src, {
    keys: (src) => src,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      duration: duration,
      easing: easings.easeInOutQuad
    },
    exitBeforeEnter: false // 确保同时显示前后图片实现交叉淡入淡出
  })

  // 添加模糊效果样式
  const blurStyle = blur ? { filter: 'blur(20px)' } : {}

  // 合并所有样式
  const combinedStyle = {
    ...style,
    ...blurStyle,
    transition: blur !== undefined ? 'filter 0.3s ease' : 'none'
  }

  return (
    <div className={`relative ${className}`}>
      {transitions((transitionStyle, item) => (
        <animated.img
          style={{
            ...transitionStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: 'cover',
            ...combinedStyle
          }}
          className={className}
          src={item}
          alt={alt}
          onError={onError}
        />
      ))}
    </div>
  )
}
