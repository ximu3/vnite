import { cn } from '~/utils'
import { GameImage } from '@ui/game-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Overview } from './Overview'
import { Record } from './Record'
import { Save } from './Save'
import { Header } from './Header'
import { useState } from 'react'

export function Game({ gameId }: { gameId: string }): JSX.Element {
  const [isImageError, setIsImageError] = useState(false)

  return (
    <div className={cn('w-full h-full pb-7 relative overflow-hidden')}>
      <div className={cn(!isImageError ? 'pt-[30px]' : 'pt-[30px] border-b-[1px]')}></div>

      {/* Background Image Layer - Absolute */}
      <div className={cn('absolute inset-0 w-full h-full pt-[30px] pr-2')}>
        <GameImage
          gameId={gameId}
          key={`${gameId}-background`}
          type="background"
          className={cn('w-full h-auto max-h-[90vh] object-cover')}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full bg-background/15')} />}
        />
      </div>

      {/* Scrollable Content */}
      <div className={cn('relative h-full overflow-auto scrollbar-base')}>
        {/* content container */}
        <div className={cn('relative top-[45%] z-20 flex flex-col', 'w-full')}>
          <Header gameId={gameId} className={cn('w-full')} />

          <div className={cn('p-7 pt-3 bg-background')}>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={cn('w-[250px] bg-muted/90')}>
                <TabsTrigger className={cn('w-1/3')} value="overview">
                  概览
                </TabsTrigger>
                <TabsTrigger className={cn('w-1/3')} value="record">
                  记录
                </TabsTrigger>
                <TabsTrigger className={cn('w-1/3')} value="save">
                  存档
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Overview gameId={gameId} />
              </TabsContent>
              <TabsContent value="record">
                <Record gameId={gameId} />
              </TabsContent>
              <TabsContent value="save">
                <Save gameId={gameId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
