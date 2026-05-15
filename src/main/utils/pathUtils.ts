import path from 'path'
import { platform } from 'os'

const IS_WINDOWS = platform() === 'win32'

/**
 * Normalize a file path: convert backslashes to forward slashes,
 * remove trailing slashes (unless drive root like C:/).
 */
export function normalizePath(filePath: string): string {
  if (!filePath) return ''
  let normalized = filePath.replace(/\\/g, '/')
  // Remove trailing slashes, but keep drive root (C:/)
  if ((normalized.length > 3 || normalized.startsWith('/')) && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

/**
 * Case-insensitive comparison on Windows, case-sensitive elsewhere.
 */
export function pathEquals(a: string, b: string): boolean {
  if (IS_WINDOWS) return normalizePath(a).toLowerCase() === normalizePath(b).toLowerCase()
  return normalizePath(a) === normalizePath(b)
}

/**
 * Check if `childPath` starts with `rootPath` as a directory prefix.
 * Prevents false matches like C:/Game/bin64 matching C:/Game/bin.
 */
export function isPathWithinRoot(childPath: string, rootPath: string): boolean {
  const nChild = normalizePath(childPath)
  const nRoot = normalizePath(rootPath)
  if (!nRoot) return false
  if (pathEquals(nChild, nRoot)) return true
  // Must match with separator to prevent false prefix matches
  if (IS_WINDOWS) {
    return nChild.toLowerCase().startsWith(nRoot.toLowerCase() + '/')
  }
  return nChild.startsWith(nRoot + '/')
}

/**
 * Mode 1 compositional words — after stripping separators,
 * a segment consisting only of these words (any order/combination) matches.
 * Sorted by descending length so that longer words are tried first during
 * decomposition (e.g. "windows" won't be mis-matched as "win"+"dows").
 */
const COMPOSITIONAL_WORDS = [
  'bin',
  '32',
  '64',
  'bit',
  'x86',
  'x64',
  'win',
  'windows',
  'release',
  'debug'
].sort((a, b) => b.length - a.length)

/**
 * Mode 2 direct match words — segment exactly equals one of these (case-insensitive).
 */
const DIRECT_MATCH_WORDS = [
  'binaries',
  'contents',
  'game',
  'data',
  'launcher',
  'linux',
  'mac',
  'macos'
]

/**
 * Recursive backtracking decomposition check.
 * Given a string and a list of words, determine if the string can be
 * fully decomposed into those words in any order. Each word may only be
 * used once per decomposition path; the matched word is removed from the
 * list passed to the recursive call so that no shared mutable state is
 * needed and backtracking is naturally clean.
 */
function canDecompose(str: string, words: string[]): boolean {
  if (str === '') return true
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (str.startsWith(word)) {
      // Remove the matched word and recurse with the remaining words
      const remaining = words.slice(0, i).concat(words.slice(i + 1))
      if (canDecompose(str.slice(word.length), remaining)) {
        return true
      }
    }
  }
  return false
}

/**
 * Check if a directory name matches a known sub-directory pattern.
 * Two modes:
 * - Mode 1 (Compositional): Strip separators (_ space - .), then recursively
 *   check if remaining string can be fully decomposed into COMPOSITIONAL_WORDS.
 * - Mode 2 (Direct): Case-insensitive exact match against DIRECT_MATCH_WORDS.
 */
export function isSubDirectoryPattern(segmentName: string): boolean {
  const lower = segmentName.toLowerCase()

  // Mode 2: Direct match
  if (DIRECT_MATCH_WORDS.includes(lower)) return true

  // Mode 1: Compositional match
  // Strip underscores, spaces, hyphens, dots
  const stripped = lower.replace(/[_\s.-]/g, '')
  // Quick check to skip expensive decomposition for long strings
  if (!stripped || stripped.length > 15) return false

  return canDecompose(stripped, COMPOSITIONAL_WORDS)
}

/**
 * Infer the game installation root directory from markPath.
 * Walks upward, stripping segments that match known sub-directory patterns.
 *
 * @param markPath - The directory where the game executable was found
 * @param scanRoot - Optional boundary: the scanner's root scan directory.
 *   If reached during upward walk → return markPath (can't determine root)
 * @returns The inferred root directory path (no trailing slash), or '' if markPath is empty
 */
export function inferRootPath(markPath: string, scanRoot?: string): string {
  if (!markPath) return ''

  const unc = IS_WINDOWS && markPath.startsWith('\\\\')
  const normalized = normalizePath(markPath)
  const normalizedRoot = normalizePath(scanRoot || '')
  const prefix = unc ? '\\\\' : normalized.startsWith('/') ? path.sep : ''
  const segments = normalized.split('/')
  // Remove empty segments (from leading slash or double slashes)
  const cleanSegments = segments.filter((s) => s.length > 0)

  if (cleanSegments.length === 0) return markPath

  // Walk from deepest segment upward
  let boundaryIndex = cleanSegments.length - 1
  for (; boundaryIndex >= 0; boundaryIndex--) {
    const segment = cleanSegments[boundaryIndex]
    if (IS_WINDOWS && segment.endsWith(':')) {
      // Stop at drive root (e.g. C:)
      return markPath
    }

    // Check if we've reached scanRoot boundary
    if (normalizedRoot) {
      const pathAtIndex = prefix + cleanSegments.slice(0, boundaryIndex + 1).join(path.sep)
      if (pathEquals(pathAtIndex, normalizedRoot)) {
        return markPath
      }
    }

    // Check if segment matches a known sub-directory pattern
    if (!isSubDirectoryPattern(segment)) {
      // Found a non-pattern segment — this is the root boundary
      break
    }
  }

  if (boundaryIndex < 0) {
    // All segments matched patterns — return markPath (can't determine root)
    return markPath
  }

  return prefix + cleanSegments.slice(0, boundaryIndex + 1).join(path.sep)
}

/**
 * Determine whether rootPath needs re-inference based on gamePath.
 * Returns the inferred rootPath if re-inference is needed, or null if already consistent.
 * Used as a pre-save check: rootPath is re-inferred when:
 * - gamePath changed and rootPath is empty or gamePath falls outside the current rootPath
 * - gamePath unchanged but rootPath is empty (auto-fill to prevent missing rootPath)
 */
export function shouldReinferRootPath(
  oldGamePath: string,
  newGamePath: string,
  rootPath: string
): string | null {
  if (!newGamePath) return null
  if (oldGamePath === newGamePath && rootPath) return null
  if (!rootPath || !isPathWithinRoot(newGamePath, rootPath)) {
    return inferRootPath(path.dirname(newGamePath))
  }
  return null
}
