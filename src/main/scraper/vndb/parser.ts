/**
 * Regular expressions for URL tags
 * Match format: [url=link]text[/url]
 */
/*eslint no-useless-escape: "off"*/
const urlMatcher = /\[url=(.*?)\](.*?)\[\/url\]/g
const bMatcher = /\[b\](.*?)\[\/b\]/g
const spoilerMatcher = /\[spoiler\](.*?)\[\/spoiler\]/g

/**
 * Formatting description text, converting BBCode to HTML tags
 * @param description Text to be formatted
 * @returns Formatted text
 */
export function formatDescription(description: string): string {
  if (description === null) {
    return ''
  }
  // Replacing line breaks with HTML line break tags
  let formatted = description.replace('\n', '<br>' + '\n')

  // Converting [url] tags to HTML a tags
  formatted = formatted.replace(urlMatcher, '<a href="$1" target="_blank">$2</a>')

  // Converting [b] tags to HTML strong tags
  formatted = formatted.replace(bMatcher, '<strong>$1</strong>')

  // Converting [spoiler] tags to HTML details tags
  formatted = formatted.replace(spoilerMatcher, '<details><summary>展开</summary>$1</details>')

  return formatted
}

/**
 * Remove all URL tags and keep only the text content.
 * @param description Text containing labels
 * @returns Plain text after removing labels
 */
export function removeDescriptionTags(description: string | null): string {
  if (description === null) {
    return ''
  }

  // Keep only the text content in the URL tag
  return description.replace(urlMatcher, '$2')
}
