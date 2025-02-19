import * as csstree from 'css-tree'
import { Element, HTMLReactParserOptions } from 'html-react-parser'
import { toast } from 'sonner'
import { v4 } from 'uuid'

export async function canAccessImageFile(gameId: string, type: string): Promise<boolean> {
  try {
    const response = await fetch(`img:///games/${gameId}/${type}`)
    return response.ok
  } catch (error) {
    console.error('Error checking image access:', error)
    return false
  }
}

interface CSSValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Verify CSS content
 * @param cssContent
 * @returns CSSValidationResult
 */
export function isValidCSS(cssContent: string): CSSValidationResult {
  try {
    // Parsing CSS with csstree
    csstree.parse(cssContent, {
      parseAtrulePrelude: false, // Avoid strict parsing of @rules
      parseRulePrelude: false, // Avoid strict parsing of selectors
      parseValue: false // Avoid strict parsing of values
    })

    return { isValid: true }
  } catch (error: any) {
    return {
      isValid: false,
      error: `CSS语法错误: ${error.message}`
    }
  }
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

export function generateUUID(): string {
  return v4()
}

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
