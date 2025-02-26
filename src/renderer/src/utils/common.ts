import { toast } from 'sonner'
import { Element, HTMLReactParserOptions } from 'html-react-parser'

export function copyWithToast(content: string): void {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      toast.success('已复制到剪切板', { duration: 1000 })
    })
    .catch((error) => {
      toast.error(`复制文本到剪切板失败: ${error}`)
    })
}

export const HTMLParserOptions: HTMLReactParserOptions = {
  replace: (domNode) => {
    if (domNode instanceof Element && domNode.name === 'a') {
      // Make sure the link opens in a new tab
      domNode.attribs.target = '_blank'
      // Add rel="noopener noreferrer" for added security
      domNode.attribs.rel = 'noopener noreferrer'
    }
  }
}
