import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '~/utils'
import crypto from 'crypto-js/md5'

const getGravatarUrl = (email: string, size: number = 80): string => {
  // Convert to lowercase and remove spaces
  const normalizedEmail = email.trim().toLowerCase()
  const hash = crypto(normalizedEmail).toString()
  // Return the Gravatar URL, use d=404 to have invalid avatars return a 404 error
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

// Extending the AvatarImage component's Props type
interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  email?: string
  gravatarSize?: number
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, email, gravatarSize = 80, ...props }, ref) => {
  // Create statuses to track if an image fails to load
  const [imageError, setImageError] = React.useState(false)

  // If email is provided and the image does not load incorrectly, use the Gravatar URL
  const imageSrc = email && !imageError ? getGravatarUrl(email, gravatarSize) : props.src

  return !imageError ? (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full', className)}
      src={imageSrc}
      onError={() => setImageError(true)}
      {...props}
    />
  ) : null
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
