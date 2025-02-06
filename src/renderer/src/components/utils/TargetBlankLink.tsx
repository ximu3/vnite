import type { Components } from 'react-markdown'

export const TargetBlankLink: Components['a'] = ({ href, children, ...props }) => {
  const isExternal = href?.startsWith('http') || href?.startsWith('//')

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}
