import { SeparatorDashed } from '@ui/separator-dashed'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'
import { CollectionPoster } from './posters/CollectionPoster'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'

export function CollectionPage(): React.JSX.Element {
  const collections = useGameCollectionStore((state) => state.documents)
  const [gap, setGap] = useState<number>(0)
  const [columns, setColumns] = useState<number>(0)
  const gridContainerRef = useRef<HTMLDivElement | null>(null)

  const selectGames = useGameBatchEditorStore((state) => state.selectGames)

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // 检查当前是否有对话框元素处于活动状态
      const isDialogActive =
        document.querySelector('dialog[open]') !== null ||
        document.querySelector('.modal.active') !== null ||
        document.querySelector('[role="dialog"]') !== null

      // 当对话框打开时，不执行快捷键功能
      if (isDialogActive) {
        return
      }

      // Ctrl + A 选择所有游戏
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        selectGames(Object.values(collections).flatMap((collection) => collection.games))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectGames, collections])

  // Sort collections by the sort field
  const sortedCollectionIds = useMemo(() => {
    return Object.values(collections)
      .sort((a, b) => a.sort - b.sort)
      .map((collection) => collection._id)
  }, [collections])

  useEffect(() => {
    const calculateGap = (): void => {
      const gridContainer = gridContainerRef.current
      if (gridContainer && gridContainer.children.length > 0) {
        const containerWidth = gridContainer.offsetWidth
        const gridItems = gridContainer.children
        const itemWidth = (gridItems[0] as HTMLDivElement).offsetWidth
        const containerStyle = window.getComputedStyle(gridContainer)
        const minGap = parseFloat(containerStyle.getPropertyValue('column-gap'))
        const pL = parseFloat(containerStyle.paddingLeft)
        const pR = parseFloat(containerStyle.paddingRight)
        const columns = Math.floor((containerWidth - pL - pR + minGap) / (itemWidth + minGap))
        setColumns(columns)
        if (columns > 1) {
          const gapTrue = (containerWidth - pL - pR - columns * itemWidth) / (columns - 1)
          setGap(gapTrue)
        }
      }
    }
    calculateGap()
    const observer = new ResizeObserver(calculateGap)
    const gridContainer = gridContainerRef.current
    if (gridContainer) {
      observer.observe(gridContainer)
    }
    return (): void => observer.disconnect()
  }, [])

  const { t } = useTranslation('game')

  return (
    <div className={cn('flex flex-col gap-3 h-full bg-transparent')}>
      <ScrollArea className={cn('w-full h-full pb-2')}>
        <div className={cn('w-full flex flex-col gap-1 pt-[18px]')}>
          <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
            <div className={cn('text-accent-foreground select-none flex-shrink-0')}>
              {' '}
              {t('showcase.sections.collections')}
            </div>
            {/* Split Line Container */}
            <SeparatorDashed className="border-border" />
          </div>
          {/* Game List Container */}
          <div
            ref={gridContainerRef}
            className={cn(
              'grid grid-cols-[repeat(auto-fill,150px)]',
              '3xl:grid-cols-[repeat(auto-fill,180px)]',
              'justify-between gap-6 w-full',
              'pt-2 pb-6 pl-5 pr-5' // Add inner margins to show shadows
            )}
          >
            {/* Render using the sorted ID array */}
            {sortedCollectionIds.map((collectionId, index) => (
              <div
                key={collectionId}
                className={cn(
                  'flex-shrink-0' // Preventing compression
                )}
              >
                <CollectionPoster
                  collectionId={collectionId}
                  parentGap={gap}
                  position={
                    (index % columns === 0 && 'left') ||
                    (index % columns === columns - 1 && 'right') ||
                    'center'
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
