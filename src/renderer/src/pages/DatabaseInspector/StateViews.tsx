import { AlertCircle, Loader2 } from 'lucide-react'
import React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import { Button } from '@ui/button'
import { Card, CardContent } from '@ui/card'

export function DatabaseInspectorRefreshFailedAlert({
  title,
  description
}: {
  title: string
  description: string
}): React.JSX.Element {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

export function DatabaseInspectorLoadingCard({ message }: { message: string }): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex min-h-[16rem] flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-sm text-muted-foreground">{message}</div>
      </CardContent>
    </Card>
  )
}

export function DatabaseInspectorErrorCard({
  error,
  retryLabel,
  onRetry
}: {
  error: string
  retryLabel: string
  onRetry: () => void
}): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex min-h-[16rem] flex-col items-center justify-center gap-3">
        <div className="text-sm text-destructive">{error}</div>
        <Button onClick={onRetry}>{retryLabel}</Button>
      </CardContent>
    </Card>
  )
}
