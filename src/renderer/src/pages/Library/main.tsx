import { Librarybar } from '~/components/Librarybar'
import { cn } from '~/utils'
import { Outlet } from '@tanstack/react-router'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { FloatingButtons } from '~/components/GameBatchEditor/FloatingButtons'
import { useRef, useState, useEffect } from 'react'
import { useLibraryStore } from './store'

export function Library({ className }: { className?: string }): React.JSX.Element {
  console.warn('[DEBUG] Library')
  const isBatchMode = useGameBatchEditorStore((state) => state.isBatchMode)

  const libraryBarWidth = useLibraryStore((state) => state.libraryBarWidth)
  const setLibraryBarWidth = useLibraryStore((state) => state.setLibraryBarWidth)
  const resetLibraryBarWidth = useLibraryStore((state) => state.resetLibraryBarWidth)

  // Dragging state
  const [isDragging, setIsDragging] = useState(false)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Store initial drag position and width
  const dragStartRef = useRef({ x: 0, initialWidth: 0 })

  // Handle drag logic
  useEffect(() => {
    const dragHandle = dragHandleRef.current
    const container = containerRef.current

    if (!dragHandle || !container) return

    const onMouseDown = (e: MouseEvent): void => {
      e.preventDefault()
      setIsDragging(true)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'

      // Store initial position and width
      dragStartRef.current = {
        x: e.clientX,
        initialWidth: libraryBarWidth
      }
    }

    const onMouseMove = (e: MouseEvent): void => {
      if (!isDragging) return

      // Calculate drag distance
      const deltaX = e.clientX - dragStartRef.current.x
      const newWidth = Math.max(0, Math.min(400, dragStartRef.current.initialWidth + deltaX))
      // Update width state
      setLibraryBarWidth(newWidth)
    }

    const onMouseUp = (): void => {
      if (isDragging) {
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    // Add event listeners
    dragHandle.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      // Remove event listeners
      dragHandle.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, libraryBarWidth, setLibraryBarWidth])

  return (
    <div ref={containerRef} className={cn('flex flex-row w-full h-full relative', className)}>
      {isBatchMode && <FloatingButtons />}

      {/* Left panel */}
      <div style={{ width: `${libraryBarWidth}px` }} className="h-full">
        <Librarybar />
      </div>

      {/* Custom drag handle */}
      <div
        ref={dragHandleRef}
        onDoubleClick={resetLibraryBarWidth}
        className={cn('w-1 h-full bg-transparent relative z-10 shrink-0 group cursor-ew-resize')}
      >
        {/* Visible drag handle */}
        <div
          className={cn(
            'absolute top-0 left-0 w-[1px] group-hover:w-1 group-hover:bg-primary h-full transition-all duration-100 ease-out',
            isDragging ? 'bg-primary w-1' : 'bg-border',
            libraryBarWidth === 0 ? 'hidden' : 'block'
          )}
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 h-full relative">
        <Outlet />
      </div>
    </div>
  )
}
