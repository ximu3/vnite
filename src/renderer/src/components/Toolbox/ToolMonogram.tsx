import { cn } from '~/utils'

function getToolMonogram(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'

  const chars = Array.from(trimmed)
  const firstMeaningfulChar = chars.find((char) => /[\p{Letter}\p{Number}]/u.test(char))
  const monogram = firstMeaningfulChar || chars[0] || '?'

  return /^[a-z]$/i.test(monogram) ? monogram.toUpperCase() : monogram
}

export interface ToolMonogramProps {
  className?: string
  name: string
}

export function ToolMonogram({ name, className }: ToolMonogramProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-muted text-foreground select-none',
        className
      )}
    >
      {getToolMonogram(name)}
    </span>
  )
}
