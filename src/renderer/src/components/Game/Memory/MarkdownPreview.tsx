import Markdown, { type Components } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { TargetBlankLink } from '~/components/utils/TargetBlankLink'
import { cn } from '~/utils'

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u'],
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? []), 'attachment']
  }
}

export function MarkdownPreview({
  value,
  className,
  emptyLabel,
  renderImages = true,
  onImageClick
}: {
  value: string
  className?: string
  emptyLabel?: string
  renderImages?: boolean
  onImageClick?: (src: string) => void
}): React.JSX.Element {
  if (!value.trim() && emptyLabel) {
    return (
      <div className={cn('text-sm text-muted-foreground select-none', className)}>{emptyLabel}</div>
    )
  }

  const MarkdownImage: Components['img'] = (props) => {
    if (!renderImages) {
      return null
    }

    const imgProps = { ...props }
    delete imgProps.node

    return (
      <img
        {...imgProps}
        className={cn(imgProps.className, onImageClick && 'cursor-zoom-in')}
        onClick={() => {
          if (!imgProps.src || !onImageClick) return
          onImageClick(imgProps.src)
        }}
      />
    )
  }

  return (
    <article
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-pre:bg-muted/50 prose-pre:text-foreground prose-pre:rounded-md',
        'prose-pre:scrollbar prose-pre:scrollbar-h-1 prose-pre:scrollbar-w-1 prose-pre:scrollbar-thumb-border prose-pre:scrollbar-thumb-rounded-lg prose-pre:scrollbar-track-transparent',
        'prose-code:before:content-none prose-code:after:content-none',
        'prose-img:rounded-md prose-img:shadow-sm',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        className
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        // URL protocol filtering is handled by the sanitize schema above.
        urlTransform={(url) => url}
        components={{
          a: TargetBlankLink,
          img: MarkdownImage
        }}
      >
        {value}
      </Markdown>
    </article>
  )
}
