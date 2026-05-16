import DOMPurify from 'dompurify'
import parse from 'html-react-parser'
import { useMemo } from 'react'
import { cn, HTMLParserOptions } from '~/utils'

const DESCRIPTION_HTML_ALLOWED_URI_REGEXP = /^(?:(?:https?|attachment):)/i

export function DescriptionHtmlContent({
  value,
  className,
  emptyLabel
}: {
  value: string
  className?: string
  emptyLabel?: string
}): React.JSX.Element {
  const sanitizedHtml = useMemo(() => {
    if (!value.trim()) return ''

    return DOMPurify.sanitize(value, {
      USE_PROFILES: { html: true },
      ALLOWED_URI_REGEXP: DESCRIPTION_HTML_ALLOWED_URI_REGEXP
    })
  }, [value])

  if (!sanitizedHtml.trim() && emptyLabel) {
    return <div className={cn(className)}>{emptyLabel}</div>
  }

  return <div className={cn(className)}>{parse(sanitizedHtml, HTMLParserOptions)}</div>
}
