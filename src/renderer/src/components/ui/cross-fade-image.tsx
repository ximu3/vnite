import { useTransition, animated, easings } from '@react-spring/web'

interface CrossfadeImageProps {
  src: string
  alt?: string
  className?: string
  duration?: number
  onError?: () => void
  blur?: boolean
  style?: React.CSSProperties
}

export function CrossfadeImage({
  src,
  alt = '',
  className = '',
  duration = 300,
  onError = () => {},
  blur = false,
  style = {}
}: CrossfadeImageProps): React.JSX.Element {
  // Create a transition for the image source
  const transitions = useTransition(src, {
    keys: (src) => src,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      duration: duration,
      easing: easings.easeInOutQuad
    },
    exitBeforeEnter: false // Ensure both images are displayed simultaneously for crossfade
  })

  const blurStyle = blur ? { filter: 'blur(20px)' } : {}

  // Combine styles for the image
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
