import { Dialog as DialogPrimitive } from 'radix-ui'
import { useMemo, useRef, useState } from 'react'
import Lightbox, { type ControllerRef } from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

import '~/styles/image-viewer.css'
import type { ImageViewerRequest } from '~/utils/image-viewer'

export function ImageViewer({
  request,
  onAfterClose
}: {
  request: ImageViewerRequest
  onAfterClose: () => void
}): React.JSX.Element | null {
  const [visible, setVisible] = useState(true)
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)
  const controllerRef = useRef<ControllerRef | null>(null)
  const safeInitialIndex =
    request.items.length === 0
      ? 0
      : Math.min(Math.max(request.initialIndex, 0), request.items.length - 1)
  const [index, setIndex] = useState(safeInitialIndex)

  const slides = useMemo(() => request.items.map(({ src }) => ({ src })), [request.items])

  if (slides.length === 0) return null

  const close = (): void => setVisible(false)

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay />
        <DialogPrimitive.Content
          className="pointer-events-auto fixed inset-0 z-[101] outline-none"
          onEscapeKeyDown={(event) => {
            // Radix captures Escape first, so close through YARL to preserve its exit cleanup.
            event.preventDefault()
            event.stopPropagation()
            controllerRef.current?.close()
          }}
          onKeyDownCapture={(event) => {
            // Capture arrows before Zoom consumes them for image panning.
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              event.stopPropagation()
              controllerRef.current?.prev()
            } else if (event.key === 'ArrowRight') {
              event.preventDefault()
              event.stopPropagation()
              controllerRef.current?.next()
            }
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div ref={setPortalContainer} />
          {portalContainer && (
            <Lightbox
              className="vnite-image-viewer"
              open={visible}
              close={close}
              index={index}
              slides={slides}
              plugins={[Counter, Zoom]}
              toolbar={{ buttons: [] }}
              render={{ buttonZoom: () => null }}
              carousel={{ finite: true, padding: '10%', imageFit: 'contain' }}
              animation={{ swipe: 0, navigation: 0 }}
              controller={{
                ref: controllerRef,
                closeOnBackdropClick: true,
                closeOnEscape: true,
                closeOnPullUp: false,
                closeOnPullDown: false,
                disableSwipeNavigation: true
              }}
              zoom={{
                minZoom: 0.5,
                maxZoomPixelRatio: 2,
                wheelZoomDistanceFactor: 400,
                scrollToZoom: true
              }}
              portal={{ root: () => portalContainer }}
              noScroll={{ disabled: true }}
              on={{
                view: ({ index: nextIndex }) => setIndex(nextIndex),
                exited: onAfterClose
              }}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
