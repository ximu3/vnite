import { useAttachmentStore } from '~/stores'
import { cn } from '~/utils'

function getToolMonogram(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'

  const chars = Array.from(trimmed)
  const firstMeaningfulChar = chars.find((char) => /[\p{Letter}\p{Number}]/u.test(char))
  const monogram = firstMeaningfulChar || chars[0] || '?'

  return /^[a-z]$/i.test(monogram) ? monogram.toUpperCase() : monogram
}

export interface ToolIconProps {
  className?: string
  name: string
  toolId: string
}

export function ToolIcon({ toolId, name, className }: ToolIconProps): React.JSX.Element {
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const attachmentId = `${toolId}.webp`
  const attachmentInfo = getAttachmentInfo('config-local', 'toolbox', attachmentId)
  const attachmentUrl = `attachment://config-local/toolbox/${attachmentId}?t=${attachmentInfo.timestamp}`

  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-md bg-muted text-foreground select-none',
        className
      )}
    >
      <span className="flex h-full w-full items-center justify-center">
        {getToolMonogram(name)}
      </span>

      {!attachmentInfo.error && (
        <img
          src={attachmentUrl}
          alt={name}
          className="absolute inset-0 h-full w-full rounded-[inherit] object-cover"
          draggable={false}
          onError={() => {
            setAttachmentError('config-local', 'toolbox', attachmentId, true)
          }}
        />
      )}
    </span>
  )
}
