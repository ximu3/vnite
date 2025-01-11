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
    <div className={cn('w-full h-full pb-[50px]')}>
      <div className={cn(!isImageError ? 'pt-[30px]' : 'pt-[30px] border-b-[1px]')}></div>
      <div className={cn('relative h-full overflow-auto scrollbar-base')}>
        {/* content container */}
        <div className={cn('absolute top-[15%] z-20 p-7 flex flex-col gap-5', 'w-full h-full')}>
          <Header gameId={gameId} className={cn('w-full bg-transparent')} />
          <div className={cn('')}>
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
        {/* Background Image Layer */}
        <GameImage
          gameId={gameId}
          type="background"
          className={cn('w-full h-full object-cover')}
          onError={() => setIsImageError(true)}
          onUpdated={() => setIsImageError(false)}
          fallback={<div className={cn('w-full h-full', 'bg-background/15')} />}
        />
        {/* gradient mask layer */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-70% via-background to-background backdrop-blur-md" />
      </div>
    </div>
  )
}
