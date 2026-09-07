export type ImageViewerItem = {
  key: string
  src: string
}

export type ImageViewerRequest = {
  items: ImageViewerItem[]
  initialIndex: number
}

export function createImageViewerRequestFromElements(
  elements: Iterable<HTMLImageElement>,
  selectedElement: HTMLImageElement,
  keyPrefix: string
): ImageViewerRequest | null {
  const images = Array.from(elements)
  const items: ImageViewerItem[] = []
  let initialIndex = -1

  for (const image of images) {
    const src = image.currentSrc || image.src || image.getAttribute('src') || ''
    if (!src) continue

    if (image === selectedElement) {
      initialIndex = items.length
    }

    items.push({
      key: `${keyPrefix}-${items.length}`,
      src
    })
  }

  if (items.length === 0 || initialIndex < 0) return null
  return { items, initialIndex }
}
