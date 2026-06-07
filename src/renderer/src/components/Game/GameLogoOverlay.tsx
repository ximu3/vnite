import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { NSFWBlurLevel } from '@appTypes/models'
import { Button } from '@ui/button'
import { GameImage } from '@ui/game-image'
import { useConfigState, useGameState } from '~/hooks'
import { useGameDetailStore } from './store'

type LogoPosition = {
  x: number
  y: number
}

const INITIAL_POSITION: LogoPosition = { x: 1.5, y: 35 }
const INITIAL_POSITION_IN_COMPACT: LogoPosition = { x: 70, y: 5 }
const INITIAL_SIZE = 100
const LOGO_SCROLL_FACTOR = 1.3

function isInitialPosition(position: LogoPosition): boolean {
  return position.x === INITIAL_POSITION.x && position.y === INITIAL_POSITION.y
}

function getRenderedPosition(
  position: LogoPosition,
  headerLayout: 'default' | 'compact'
): LogoPosition {
  if (headerLayout === 'compact' && isInitialPosition(position)) {
    return INITIAL_POSITION_IN_COMPACT
  }

  return position
}

export const GameLogoOverlay = React.memo(function GameLogoOverlay({
  gameId,
  scrollAreaRef
}: {
  gameId: string
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const logoRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const scrollTopRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)

  const [headerLayout] = useConfigState('appearances.gameDetail.headerLayout')
  const [showLogo] = useConfigState('appearances.gameDetail.showLogo')
  const [nsfwBlurLevel] = useConfigState('appearances.nsfwBlurLevel')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [logoPosition, setLogoPosition, saveLogoPosition] = useGameState(
    gameId,
    'apperance.logo.position',
    true
  )
  const [logoSize, setLogoSize, saveLogoSize] = useGameState(gameId, 'apperance.logo.size', true)
  const [logoVisible, setLogoVisible] = useGameState(gameId, 'apperance.logo.visible')
  const isEditingLogo = useGameDetailStore((state) => state.isEditingLogo)
  const setIsEditingLogo = useGameDetailStore((state) => state.setIsEditingLogo)

  const hideLogo = nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImage
  const logoShown = showLogo && logoVisible && !hideLogo

  const logoPositionRef = useRef<LogoPosition>(logoPosition)
  const logoSizeRef = useRef(logoSize)
  const headerLayoutRef = useRef(headerLayout)
  const logoVisibleRef = useRef(logoVisible)
  const setLogoPositionRef = useRef(setLogoPosition)

  // Keep refs current so the long-lived pointer handlers can read fresh values.
  if (!draggingRef.current) {
    logoPositionRef.current = logoPosition
    logoSizeRef.current = logoSize
  }
  headerLayoutRef.current = headerLayout
  logoVisibleRef.current = logoVisible
  setLogoPositionRef.current = setLogoPosition

  const syncLogoStyle = (): void => {
    if (!logoRef.current || !logoVisibleRef.current) return

    const renderedPosition = getRenderedPosition(logoPositionRef.current, headerLayoutRef.current)
    logoRef.current.style.left = `${renderedPosition.x}vw`
    logoRef.current.style.top = `${renderedPosition.y}vh`
    logoRef.current.style.transform = `translateY(-${scrollTopRef.current * LOGO_SCROLL_FACTOR}px) scale(${logoSizeRef.current / 100})`
  }

  const scheduleLogoStyleSync = (): void => {
    if (rafIdRef.current !== null) return

    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null
      syncLogoStyle()
    })
  }

  // Re-apply the DOM-driven logo style after React updates persisted inputs.
  useLayoutEffect(() => {
    syncLogoStyle()
  }, [gameId, headerLayout, logoPosition, logoSize, logoShown])

  // Clear any carried-over parallax offset when navigating to a different game.
  useEffect(() => {
    scrollTopRef.current = 0
    scheduleLogoStyleSync()
  }, [gameId])

  // Stop dragging immediately if the logo becomes hidden or masked mid-interaction.
  useEffect(() => {
    if (logoShown) return

    draggingRef.current = false
    setDragging(false)
  }, [logoShown])

  // Listen on the document so dragging continues even after the pointer leaves the logo.
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      if (!draggingRef.current) return

      logoPositionRef.current = {
        x: ((event.clientX - dragOffsetRef.current.x) * 100) / window.innerWidth,
        y: ((event.clientY - dragOffsetRef.current.y) * 100) / window.innerHeight
      }

      syncLogoStyle()
    }

    const handlePointerUp = (): void => {
      if (!draggingRef.current) return

      draggingRef.current = false
      setDragging(false)
      void setLogoPositionRef.current(logoPositionRef.current)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', handlePointerUp)

    return (): void => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [])

  // Read the ScrollArea viewport position and mirror it into the logo parallax transform.
  useEffect(() => {
    if (!logoShown) return

    const viewportElement = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    if (!viewportElement) return

    const handleScroll = (): void => {
      scrollTopRef.current = (viewportElement as HTMLElement).scrollTop
      scheduleLogoStyleSync()
    }

    handleScroll()
    viewportElement.addEventListener('scroll', handleScroll)

    return (): void => {
      viewportElement.removeEventListener('scroll', handleScroll)
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [scrollAreaRef, gameId, logoShown])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    if (!isEditingLogo) return
    if (!logoRef.current) return
    if (event.button !== 0) return

    draggingRef.current = true
    setDragging(true)

    const renderedPosition = getRenderedPosition(logoPositionRef.current, headerLayoutRef.current)
    dragOffsetRef.current = {
      x: event.clientX - (renderedPosition.x * window.innerWidth) / 100,
      y: event.clientY - (renderedPosition.y * window.innerHeight) / 100
    }
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    if (!isEditingLogo) return
    event.preventDefault()

    const delta = event.deltaY * -0.01
    const nextSize = Math.min(Math.max(logoSizeRef.current + delta * 5, 30), 200)
    logoSizeRef.current = nextSize
    syncLogoStyle()
    void setLogoSize(nextSize)
  }

  const handleResetPosition = (): void => {
    logoPositionRef.current = INITIAL_POSITION
    syncLogoStyle()
    void setLogoPosition(INITIAL_POSITION)
  }

  const handleResetSize = (): void => {
    logoSizeRef.current = INITIAL_SIZE
    syncLogoStyle()
    void setLogoSize(INITIAL_SIZE)
  }

  const handleConfirm = (): void => {
    setIsEditingLogo(false)
    void saveLogoPosition()
    void saveLogoSize()
  }

  return (
    <>
      {showLogo && isEditingLogo && !hideLogo && (
        <div className="absolute top-[10px] left-[10px] z-40 bg-transparent p-3 rounded-lg flex gap-3">
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/95"
            onClick={handleResetPosition}
          >
            {t('detail.logoManagePanel.resetPosition')}
          </Button>
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/95"
            onClick={handleResetSize}
          >
            {t('detail.logoManagePanel.resetSize')}
          </Button>
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/95"
            onClick={() => void setLogoVisible(!logoVisible)}
          >
            {t(logoVisible ? 'detail.logoManagePanel.hideLogo' : 'detail.logoManagePanel.showLogo')}
          </Button>
          <Button
            variant="default"
            className="bg-primary hover:bg-primary/95"
            onClick={handleConfirm}
          >
            {t('utils:common.confirm')}
          </Button>
        </div>
      )}

      {logoShown && (
        <div
          ref={logoRef}
          onPointerDown={handlePointerDown}
          onWheel={handleWheel}
          style={{
            cursor: isEditingLogo ? (dragging ? 'grabbing' : 'grab') : 'default',
            transformOrigin: 'center center',
            zIndex: isEditingLogo ? 30 : 10,
            touchAction: 'none'
          }}
          className="absolute will-change-transform"
        >
          <GameImage
            gameId={gameId}
            key={`${gameId}-logo`}
            type="logo"
            className="w-auto max-h-[15vh] object-contain"
            fallback={<div />}
          />
        </div>
      )}
    </>
  )
})
