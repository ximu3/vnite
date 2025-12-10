/**
 * Compute the Jaro similarity between two strings.
 */
function jaro(s1: string, s2: string): number {
  const len1 = s1.length
  const len2 = s2.length

  const matchWindow = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0)
  const offsets: number[] = []
  for (let d = 0; d <= matchWindow; d++) {
    if (d === 0) offsets.push(0)
    else {
      offsets.push(d)
      offsets.push(-d)
    }
  }

  const s1Matches: number[] = []
  const s2Matches: number[] = []
  const s2Used: boolean[] = new Array(len2).fill(false)

  // --- Count matches ---
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(len2 - 1, i + matchWindow)

    for (const off of offsets) {
      const j = i + off
      if (j < start || j > end) continue
      if (s2Used[j]) continue // has been matched
      if (s1[i] === s2[j]) {
        s1Matches.push(i)
        s2Matches.push(j)
        s2Used[j] = true
        break // extremely important: pick the nearest matching j
      }
    }
  }
  const matches = s1Matches.length
  if (matches === 0) return 0

  // --- Count transpositions ---
  let transpositions = 0
  for (let k = 0; k < matches; k++) {
    if (s1[s1Matches[k]] !== s2[s2Matches[k]]) {
      transpositions++
    }
  }
  transpositions /= 2

  return (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3
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
