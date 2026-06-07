import { useRouter, useRouterState } from '@tanstack/react-router'
import { Button } from '@ui/button'
import { Card, CardContent } from '@ui/card'
import { ScrollArea } from '@ui/scroll-area'
import { AlertTriangleIcon, HomeIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function ErrorDetails({ error }: { error: Error }): React.JSX.Element {
  return (
    <Card className="min-h-0 flex-1 gap-0 overflow-hidden rounded-lg">
      <CardContent className="min-h-0 flex-1 px-0">
        <ScrollArea className="h-full w-full">
          <pre className="px-6 text-xs whitespace-pre-wrap break-words text-destructive/80">
            {error.stack ?? error.message}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function ErrorActionButtons({ onGoHome }: { onGoHome: () => void }): React.JSX.Element {
  const { t } = useTranslation('utils')

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={onGoHome}>
        <HomeIcon className="size-4" />
        {t('rendererError.goHome')}
      </Button>
    </div>
  )
}

export function RouteContentErrorFallback({ error }: { error: Error }): React.JSX.Element {
  const { t } = useTranslation('utils')
  const router = useRouter()
  const currentLocation = useRouterState({
    select: (state) => state.location.href
  })

  function handleGoHome(): void {
    void router.navigate({
      to: '/library/home',
      replace: true
    })
  }

  return (
    <div className="h-full w-full overflow-hidden px-8 py-8">
      <div className="flex h-full w-full min-h-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertTriangleIcon className="size-5" />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">{t('rendererError.contentTitle')}</h2>
            <p className="text-sm text-destructive">{error.message}</p>
            <p className="text-xs text-muted-foreground">
              {t('rendererError.location', { path: currentLocation })}
            </p>
          </div>
        </div>
        <ErrorDetails error={error} />
        <ErrorActionButtons onGoHome={handleGoHome} />
      </div>
    </div>
  )
}
