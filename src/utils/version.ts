import semver from 'semver'

/**
 * Normalize a version-like string to a valid semantic version.
 * Accepts strict semver strings and loose values that can be coerced, such as "v1.2" or "1.2".
 */
export function normalizeSemanticVersion(version: string): string | null {
  return semver.valid(version) ?? semver.valid(semver.coerce(version))
}

/**
 * Compare two version-like strings after semantic-version normalization.
 * Returns 1 when left is newer, -1 when right is newer, and 0 when they are equivalent.
 */
export function compareSemanticVersions(left: string, right: string): number {
  const normalizedLeft = normalizeSemanticVersion(left)
  const normalizedRight = normalizeSemanticVersion(right)

  if (!normalizedLeft || !normalizedRight) {
    throw new Error(`Invalid semantic version comparison: ${left}, ${right}`)
  }

  return semver.compare(normalizedLeft, normalizedRight)
}

/**
 * Check whether a version-like string satisfies a semantic version range.
 * Prerelease versions are included so app builds such as "5.0.0-beta.1" can match migration ranges.
 */
export function satisfiesSemanticVersion(version: string, range: string): boolean {
  const normalizedVersion = normalizeSemanticVersion(version)

  if (!normalizedVersion) {
    return false
  }

  return semver.satisfies(normalizedVersion, range, { includePrerelease: true })
}
