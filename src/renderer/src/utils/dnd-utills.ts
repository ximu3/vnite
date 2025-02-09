import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { DropIndicator } from '@ui/drop-indicator'
import { createPortal } from 'react-dom'
import invariant from 'tiny-invariant'

type GetOffsetFn = (args: { container: HTMLElement }) => {
  x: number
  y: number
}

type PreviewState =
  | {
      type: 'idle'
    }
  | {
      type: 'preview'
      container: HTMLElement
    }

export const calPreviewOffset = (x_offset: number, y_offset: number): GetOffsetFn => {
  return (container) => {
    const half = centerUnderPointer(container)
    return { x: half.x * x_offset * 2, y: half.y * y_offset * 2 }
  }
}

export {
  attachClosestEdge,
  combine,
  createPortal,
  draggable,
  DropIndicator,
  dropTargetForElements,
  extractClosestEdge,
  invariant,
  setCustomNativeDragPreview
}

export type { Edge, PreviewState }
