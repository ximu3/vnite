// Modified from https://github.com/alexreardon/pdnd-react-tailwind/blob/main/src/drop-indicator.tsx
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types'
import type { CSSProperties, HTMLAttributes } from 'react'

type Orientation = 'horizontal' | 'vertical'

const edgeToOrientationMap: Record<Edge, Orientation> = {
  top: 'horizontal',
  bottom: 'horizontal',
  left: 'vertical',
  right: 'vertical'
}

const orientationStyles: Record<Orientation, HTMLAttributes<HTMLElement>['className']> = {
  horizontal:
    'h-[--line-thickness] left-[--terminal-radius] right-0 before:left-[--negative-terminal-size]',
  vertical:
    'w-[--line-thickness] top-[--terminal-radius] bottom-0 before:top-[--negative-terminal-size]'
}

const edgeStyles: Record<Edge, HTMLAttributes<HTMLElement>['className']> = {
  top: 'top-[--line-offset] before:top-[--offset-terminal]',
  right: 'right-[--line-offset] before:right-[--offset-terminal]',
  bottom: 'bottom-[--line-offset] before:bottom-[--offset-terminal]',
  left: 'left-[--line-offset] before:left-[--offset-terminal]'
}

const strokeSize = 2
const terminalSize = 8
const offsetToAlignTerminalWithLine = (strokeSize - terminalSize) / 2

/**
 * This is a tailwind port of `@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box`
 */
export function DropIndicator({ edge, gap }: { edge: Edge; gap: string }): React.JSX.Element {
  const lineOffset = `calc(-0.5 * (${gap} + ${strokeSize}px))`

  const orientation = edgeToOrientationMap[edge]

  const indicator = (
    <div
      style={
        {
          '--line-thickness': `${strokeSize}px`,
          '--line-offset': `${lineOffset}`,
          '--terminal-size': `${terminalSize}px`,
          '--terminal-radius': `${terminalSize / 2}px`,
          '--negative-terminal-size': `-${terminalSize}px`,
          '--offset-terminal': `${offsetToAlignTerminalWithLine}px`
        } as CSSProperties
      }
      className={`absolute z-10 bg-accent-foreground pointer-events-none
        before:content-[''] before:w-[--terminal-size] before:h-[--terminal-size]
        box-border before:absolute before:border-[length:--line-thickness]
        before:border-solid before:border-accent-foreground before:rounded-full
        ${orientationStyles[orientation]} ${[edgeStyles[edge]]} overflow-visible`}
    ></div>
  )

  return indicator
}
