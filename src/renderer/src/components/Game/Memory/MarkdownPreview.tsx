import { CheckIcon } from 'lucide-react'
import { useRef } from 'react'
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
  onImageClick?: (selectedImage: HTMLImageElement, images: NodeListOf<HTMLImageElement>) => void
}): React.JSX.Element {
  const articleRef = useRef<HTMLElement>(null)

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
        onClick={(event) => {
          if (!imgProps.src || !onImageClick || !articleRef.current) return
          event.preventDefault()
          event.stopPropagation()
          onImageClick(event.currentTarget, articleRef.current.querySelectorAll('img'))
        }}
      />
    )
  }

  // Render task-list checkboxes with theme colors instead of browser disabled styles.
  const MarkdownInput: Components['input'] = (props) => {
    if (props.type === 'checkbox') {
      return (
        <span
          className={cn(
            'absolute top-[0.3em] start-0 inline-flex size-[1em] shrink-0 items-center justify-center rounded-[0.2em] border shadow-xs',
            props.checked
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-primary bg-transparent text-transparent'
          )}
        >
          <CheckIcon className="size-[0.75em]" strokeWidth={3} />
        </span>
      )
    }

    const inputProps = { ...props }
    delete inputProps.node

    return <input {...inputProps} />
  }

  return (
    <article
      ref={articleRef}
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-pre:bg-muted/50 prose-pre:text-foreground prose-pre:rounded-md',
        'prose-pre:scrollbar prose-pre:scrollbar-h-1 prose-pre:scrollbar-w-1 prose-pre:scrollbar-thumb-border prose-pre:scrollbar-thumb-rounded-lg prose-pre:scrollbar-track-transparent',
        'prose-code:before:content-none prose-code:after:content-none',
        'prose-img:rounded-md prose-img:shadow-sm',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // Adjust task list styles
        '[&_ul.contains-task-list]:list-none [&_ul.contains-task-list]:ps-0 [&_ul.contains-task-list]:ms-0',
        '[&_li.task-list-item]:relative [&_li.task-list-item]:list-none [&_li.task-list-item]:ps-[2em]',
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
          img: MarkdownImage,
          input: MarkdownInput
        }}
      >
        {value}
      </Markdown>
    </article>
  )
}
