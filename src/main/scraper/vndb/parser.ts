/**
 * URL标签的正则表达式
 * 匹配格式: [url=链接]文本[/url]
 */
/*eslint no-useless-escape: "off"*/
const urlMatcher = /\[url=(.*?)\](.*?)\[\/url\]/g
const bMatcher = /\[b\](.*?)\[\/b\]/g
const spoilerMatcher = /\[spoiler\](.*?)\[\/spoiler\]/g

/**
 * 格式化描述文本,将BBCode转换为HTML标签
 * @param description 需要格式化的文本
 * @returns 格式化后的文本
 */
export function formatDescription(description: string): string {
  if (description === null) {
    return ''
  }
  // 替换换行符为HTML换行标签
  let formatted = description.replace('\n', '<br>' + '\n')

  // 将[url]标签转换为HTML的a标签
  formatted = formatted.replace(urlMatcher, '<a href="$1" target="_blank">$2</a>')

  // 将[b]标签转换为HTML的strong标签
  formatted = formatted.replace(bMatcher, '<strong>$1</strong>')

  // 将[spoiler]标签转换为HTML的details标签
  formatted = formatted.replace(spoilerMatcher, '<details><summary>展开</summary>$1</details>')

  return formatted
}

/**
 * 移除所有URL标签,只保留文本内容
 * @param description 包含标签的文本
 * @returns 移除标签后的纯文本
 */
export function removeDescriptionTags(description: string | null): string {
  if (description === null) {
    return ''
  }

  // 只保留URL标签中的文本内容
  return description.replace(urlMatcher, '$2')
}
