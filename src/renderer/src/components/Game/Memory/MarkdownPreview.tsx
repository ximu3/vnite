import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { TargetBlankLink } from '~/components/utils/TargetBlankLink'
import { cn } from '~/utils'

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u']
}

export function MarkdownPreview({
  value,
  className,
  emptyLabel
}: {
  value: string
  className?: string
  emptyLabel?: string
}): React.JSX.Element {
  if (!value.trim() && emptyLabel) {
    return (
      <div className={cn('text-sm text-muted-foreground select-none', className)}>{emptyLabel}</div>
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
        components={{
          a: TargetBlankLink
        }}
      >
        {value}
      </Markdown>
    </article>
  )
}
