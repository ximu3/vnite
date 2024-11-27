import * as csstree from 'css-tree'
import { HTMLReactParserOptions, Element } from 'html-react-parser'

interface CSSValidationResult {
  isValid: boolean
  error?: string
}

export function isValidCSS(cssContent: string): CSSValidationResult {
  try {
    // 使用 csstree 解析 CSS
    csstree.parse(cssContent, {
      parseAtrulePrelude: false, // 避免对 @规则 进行严格解析
      parseRulePrelude: false, // 避免对选择器进行严格解析
      parseValue: false // 避免对值进行严格解析
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
      // 确保链接打开在新标签页中
      domNode.attribs.target = '_blank'
      // 可选：添加 rel="noopener noreferrer" 以提高安全性
      domNode.attribs.rel = 'noopener noreferrer'
    }
  }
}
