/**
 * Compute the Jaro similarity between two strings.
 */
export function jaro(s1: string, s2: string): number {
  const [shorter, longer] = s1.length <= s2.length ? [s1, s2] : [s2, s1]
  const shorterLength = shorter.length
  const longerLength = longer.length

  const matchWindow = Math.max(Math.floor(longerLength / 2) - 1, 0)

  const shorterMatches: number[] = []
  const longerMatches: number[] = []
  const longerUsed: boolean[] = new Array(longerLength).fill(false)

  // --- Count matches ---
  for (let i = 0; i < shorterLength; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(longerLength - 1, i + matchWindow)

    for (let j = start; j <= end; j++) {
      if (longerUsed[j]) continue // has been matched
      if (shorter[i] === longer[j]) {
        shorterMatches.push(i)
        longerMatches.push(j)
        longerUsed[j] = true
        break // pick the leftmost available matching j
      }
    }
  }
  const matches = shorterMatches.length
  if (matches === 0) return 0

  // --- Count transpositions ---
  const longerMatchesInOrder = [...longerMatches].sort((a, b) => a - b)
  let transpositions = 0
  for (let k = 0; k < matches; k++) {
    if (shorter[shorterMatches[k]] !== longer[longerMatchesInOrder[k]]) {
      transpositions++
    }
  }
  transpositions /= 2

  return (
    (matches / shorterLength + matches / longerLength + (matches - transpositions) / matches) / 3
  )
}

/**
 * Count common prefix (max maxPrefix).
 */
function commonPrefixLength(s1: string, s2: string, maxPrefix: number): number {
  const max = Math.min(maxPrefix, s1.length, s2.length)

  for (let i = 0; i < max; i++) {
    if (s1[i] !== s2[i]) return i
  }
  return max
}

/**
 * Compute Jaro–Winkler similarity between two strings.
 * @param s1 string 1
 * @param s2 string 2
 * @param p scaling factor for prefix enhancement
 * @returns Jaro–Winkler similarity score between 0 and 1
 */
export function jaroWinkler(s1: string, s2: string, p: number = 0.1): number {
  const jaroDistance = jaro(s1, s2)
  const maxPrefix = 4
  const prefixLength = commonPrefixLength(s1, s2, maxPrefix)

  return jaroDistance + prefixLength * p * (1 - jaroDistance)
}

const INVALID_FILENAME_CHAR_PATTERN = /[<>:"/\\|?*]/g

/**
 * Remove characters that are invalid in a single filename or directory component on Windows.
 */
export function sanitizeFilenameComponent(value: string, replacement = ' '): string {
  return value.replace(INVALID_FILENAME_CHAR_PATTERN, replacement)
}
