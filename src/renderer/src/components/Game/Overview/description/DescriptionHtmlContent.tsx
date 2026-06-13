import DOMPurify from 'dompurify'
import parse, { Element, type HTMLReactParserOptions, Text } from 'html-react-parser'
import { Fragment, useMemo } from 'react'
import { cn, HTMLParserOptions } from '~/utils'

const DESCRIPTION_HTML_ALLOWED_URI_REGEXP = /^(?:(?:https?|attachment|file):|[a-z]:[/\\])/i

function renderTextWithLineBreaks(text: string): React.JSX.Element {
  const parts = text.split(/\r\n|\r|\n/)

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          {part}
        </Fragment>
      ))}
    </>
  )
}

const DESCRIPTION_HTML_PARSER_OPTIONS: HTMLReactParserOptions = {
  ...HTMLParserOptions,
  replace: (domNode, index) => {
    HTMLParserOptions.replace?.(domNode, index)

    // Steam wraps content in heading tags with class "bb_tag" — render as plain text
    if (domNode instanceof Element && domNode.attribs.class?.includes('bb_tag')) {
      domNode.name = 'p'
      delete domNode.attribs.class
    }

    if (domNode instanceof Text && /[\r\n]/.test(domNode.data) && domNode.data.trim()) {
      return renderTextWithLineBreaks(domNode.data)
    }

    return
  }
}

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

  return (
    <div className={cn(className)}>{parse(sanitizedHtml, DESCRIPTION_HTML_PARSER_OPTIONS)}</div>
  )
}
