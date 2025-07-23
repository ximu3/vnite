import React from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { cn } from '~/utils'

export function MarkdownRenderer({
  content,
  className
}: {
  content: string
  className?: string
}): React.JSX.Element {
  // 使用marked.parse的同步版本
  const rawHtml = marked.parse(content, { async: false }) as string

  // 清理HTML以防止XSS攻击
  const cleanHtml = DOMPurify.sanitize(rawHtml)

  return (
    // 使用prose类来应用Typography样式
    <div
      className={cn(
        'prose text-foreground',
        'prose-headings:font-bold prose-headings:text-lg prose-headings:text-card-foreground',
        'prose-ul:list-disc prose-ul:ml-0',
        'prose-li:mb-0',
        'prose-a:text-primary', // Link Color
        'prose-a:no-underline hover:prose-a:underline', // underline effect

        // 代码块样式
        'prose-pre:bg-muted/30 prose-pre:text-muted-foreground prose-pre:rounded-md',

        className
      )}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}
