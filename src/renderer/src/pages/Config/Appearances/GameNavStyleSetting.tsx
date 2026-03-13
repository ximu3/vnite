import { GameNavElement, GameNavElementType, ReservableType } from '@appTypes/models/config'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types'
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder'
import { Card } from '@ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'

const defaultSortOrder: GameNavElementType[] = [
  'gameIcon',
  'gameName',
  'sortInfo',
  'localFlag',
  'playStatus'
]

export function GamenavStyleSetting(): React.JSX.Element {
  const { t } = useTranslation('config')

  const [gameNavStyle, setGameNavStyle] = useConfigState('game.gameList.gameNavStyle')

  const [shownItems, setShownItems] = useState<Set<GameNavElementType>>(
    new Set(gameNavStyle.map((item) => item.type))
  )
  const [reserveSpaceItems, setReserveSpaceItems] = useState<Set<ReservableType>>(
    new Set(
      gameNavStyle
        .filter(
          (item): item is Extract<GameNavElement, { type: ReservableType }> =>
            item.type === 'localFlag' || item.type === 'playStatus'
        )
        .filter((item) => item.reserveSpace)
        .map((item) => item.type)
    )
  )
  const [sortItems, setSortItems] = useState<GameNavElementType[]>([
    ...shownItems,
    ...defaultSortOrder.filter((item) => !shownItems.has(item))
  ])

  const stableItems = useRef(sortItems)
  useEffect(() => {
    stableItems.current = sortItems
  }, [sortItems])

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor({ source }) {
          return source.data.scenario === 'config-game-nav'
        },

        onDrop({ location, source }) {
          if (!location.current.dropTargets.length) {
            return
          }

          const currentItems = stableItems.current
          const startIndex = currentItems.findIndex((item) => item === source.data.id)

          const target = location.current.dropTargets[0]
          const indexOfTarget = currentItems.findIndex((item) => item === target.data.id)
          const closestEdge: Edge | null = extractClosestEdge(target.data)

          const finishIndex = getReorderDestinationIndex({
            startIndex,
            indexOfTarget,
            closestEdgeOfTarget: closestEdge,
            axis: 'horizontal'
          })

          if (finishIndex === startIndex) {
            return
          }

          setSortItems((prev) =>
            reorder({
              list: prev,
              startIndex,
              finishIndex
            })
          )
        }
      })
    )
  }, [])

  useEffect(() => {
    const newGameNavStyle: GameNavElement[] = sortItems
      .filter((type) => shownItems.has(type))
      .map((type) => {
        if (type === 'localFlag' || type === 'playStatus') {
          return {
            type,
            reserveSpace: reserveSpaceItems.has(type)
          }
        } else {
          return { type }
        }
      })

    setGameNavStyle(newGameNavStyle)
  }, [shownItems, reserveSpaceItems, sortItems])

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t('appearances.gameList.gameNavStyle.title')}</span>
        <span className="text-sm text-muted-foreground whitespace-pre-line">
          {t('appearances.gameList.gameNavStyle.description')}{' '}
        </span>
      </div>

      <div className="flex flex-row justify-between gap-2">
        {sortItems.map((item) => {
          switch (item) {
            case 'gameName':
              return <StyleItem key={item} type={item} />

            case 'gameIcon':
            case 'sortInfo':
              return (
                <StyleItem
                  key={item}
                  type={item}
                  onShownChange={(shown) => {
                    setShownItems((prev) => {
                      const next = new Set(prev)
                      if (shown) next.add(item)
                      else next.delete(item)
                      return next
                    })
                  }}
                />
              )

            case 'localFlag':
            case 'playStatus':
              return (
                <StyleItem
                  key={item}
                  type={item}
                  onShownChange={(shown) => {
                    setShownItems((prev) => {
                      const next = new Set(prev)
                      if (shown) next.add(item)
                      else next.delete(item)
                      return next
                    })
                  }}
                  onReserveSpaceChange={(reserve) => {
                    setReserveSpaceItems((prev) => {
                      const next = new Set(prev)
                      if (reserve) next.add(item)
                      else next.delete(item)
                      return next
                    })
                  }}
                />
              )
          }
        })}
      </div>
    </Card>
  )
}

type DraggableItemProps = {
  onShownChange?: (shown: boolean) => void
  onReserveSpaceChange?: (reserve: boolean) => void
  type: GameNavElementType
}

function StyleItem({
  type,
  onShownChange,
  onReserveSpaceChange
}: DraggableItemProps): React.JSX.Element {
  const [gameNavStyle] = useConfigState('game.gameList.gameNavStyle')
  const [borderState, setBorderState] = useState<'solid' | 'dashed' | 'light-dashed'>('solid')

  const { t } = useTranslation('config')

  useEffect(() => {
    switch (type) {
      case 'gameName': {
        setBorderState('solid')
        break
      }

      case 'gameIcon':
      case 'sortInfo': {
        const item = gameNavStyle.find((item) => item.type === type)
        setBorderState(item ? 'solid' : 'light-dashed')
        break
      }

      case 'localFlag':
      case 'playStatus': {
        const item = gameNavStyle.find((item) => item.type === type) as Extract<
          GameNavElement,
          { type: ReservableType }
        > | null
        if (!item) {
          setBorderState('light-dashed')
        } else if (item.reserveSpace) {
          setBorderState('solid')
        } else {
          setBorderState('dashed')
        }
        break
      }
    }
  }, [])

  const handleClick = (): void => {
    switch (type) {
      case 'gameIcon':
      case 'sortInfo': {
        if (borderState === 'solid') {
          setBorderState('light-dashed')
          onShownChange?.(false)
        } else {
          setBorderState('solid')
          onShownChange?.(true)
        }
        break
      }

      case 'localFlag':
      case 'playStatus': {
        if (borderState === 'solid') {
          setBorderState('dashed')
          onReserveSpaceChange?.(false)
        } else if (borderState === 'dashed') {
          setBorderState('light-dashed')
          onShownChange?.(false)
        } else {
          setBorderState('solid')
          onShownChange?.(true)
          onReserveSpaceChange?.(true)
        }
        break
      }
    }
  }

  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return combine(
      draggable({
        element,
        getInitialData: () => ({
          id: type,
          scenario: 'config-game-nav'
        })
      }),
      dropTargetForElements({
        element,
        getData: () => ({
          id: type,
          scenario: 'config-game-nav'
        })
      })
    )
  }, [])

  return type === 'gameName' ? (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-center flex-1 p-4 text-sm',
        'text-muted-foreground border-2 border-solid border-ring/60 rounded'
      )}
    >
      {t(`appearances.gameList.gameNavStyle.${type}`)}
    </div>
  ) : (
    <Tooltip>
      <TooltipTrigger>
        <div
          ref={ref}
          className={cn(
            'flex items-center justify-center rounded p-4 text-sm cursor-pointer hover:bg-accent',
            borderState === 'solid' && 'border-2 border-solid border-ring',
            borderState === 'dashed' && 'border-2 border-dashed border-ring',
            borderState === 'light-dashed' && 'border-2 border-dashed border-muted'
          )}
          onClick={handleClick}
        >
          {t(`appearances.gameList.gameNavStyle.${type}`)}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {t(`appearances.gameList.gameNavStyle.${type}Description`)}
      </TooltipContent>
    </Tooltip>
  )
}
