'use client'

import * as React from 'react'
import { Avatar as AvatarPrimitive } from 'radix-ui'
import crypto from 'crypto-js/md5'

import { cn } from '~/utils'

const getGravatarUrl = (email: string, size: number = 80): string => {
  // Convert to lowercase and remove spaces
  const normalizedEmail = email.trim().toLowerCase()
  const hash = crypto(normalizedEmail).toString()
  // Return the Gravatar URL, use d=404 to have invalid avatars return a 404 error
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>): React.JSX.Element {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

interface AvatarImageProps extends React.ComponentProps<typeof AvatarPrimitive.Image> {
  email?: string
  gravatarSize?: number
}

function AvatarImage({
  className,
  email,
  gravatarSize,
  ...props
}: AvatarImageProps): React.JSX.Element {
  // Create statuses to track if an image fails to load
  const [imageError, setImageError] = React.useState(false)

  // If email is provided and the image does not load incorrectly, use the Gravatar URL
  const imageSrc = email && !imageError ? getGravatarUrl(email, gravatarSize) : props.src
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      src={imageSrc}
      onError={() => setImageError(true)}
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>): React.JSX.Element {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
