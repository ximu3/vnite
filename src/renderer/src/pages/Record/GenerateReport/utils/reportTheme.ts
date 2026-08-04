const TOKEN_NAMES = [
  'background',
  'foreground',
  'muted',
  'muted-foreground',
  'card',
  'card-foreground',
  'border',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'radius'
] as const

type ReportThemePreference = 'current' | 'light' | 'dark'
type ThemeTokens = Record<(typeof TOKEN_NAMES)[number], string>

const LIGHT_THEME: ThemeTokens = {
  background: 'hsl(230 8% 85%)',
  foreground: 'hsl(229 26% 28%)',
  muted: 'hsl(230 12% 81%)',
  'muted-foreground': 'hsl(230 12% 21%)',
  card: 'hsl(230 8% 83%)',
  'card-foreground': 'hsl(229 26% 23%)',
  border: 'hsl(0 0% 80%)',
  primary: 'hsl(223 42% 57%)',
  'primary-foreground': 'hsl(0 0% 100%)',
  secondary: 'hsl(223 30% 75%)',
  'secondary-foreground': 'hsl(223 30% 15%)',
  accent: 'hsl(230 8% 70%)',
  'accent-foreground': 'hsl(230 8% 10%)',
  destructive: 'hsl(2 82% 30%)',
  'destructive-foreground': 'hsl(2 82% 90%)',
  radius: '0.625rem'
}

const DARK_THEME: ThemeTokens = {
  background: 'hsl(230 24% 19%)',
  foreground: 'hsl(229 35% 75%)',
  muted: 'hsl(230 12% 23%)',
  'muted-foreground': 'hsl(230 12% 73%)',
  card: 'hsl(230 24% 17%)',
  'card-foreground': 'hsl(229 35% 80%)',
  border: 'hsl(230 14% 24%)',
  primary: 'hsl(223 45% 44%)',
  'primary-foreground': 'hsl(0 0% 100%)',
  secondary: 'hsl(223 30% 75%)',
  'secondary-foreground': 'hsl(223 30% 15%)',
  accent: 'hsl(230 24% 34%)',
  'accent-foreground': 'hsl(230 24% 94%)',
  destructive: 'hsl(2 80% 58%)',
  'destructive-foreground': 'hsl(0 0% 100%)',
  radius: '0.625rem'
}

function sanitizeCssValue(value: string, fallback: string): string {
  if (
    !value ||
    /[<>{};\\]/.test(value) ||
    /url\s*\(|@import|(?:attachment|file|https?):/i.test(value)
  ) {
    return fallback
  }
  return value
}

function readCurrentTheme(fallback: ThemeTokens): ThemeTokens {
  const computedStyle = getComputedStyle(document.documentElement)
  return Object.fromEntries(
    TOKEN_NAMES.map((name) => [
      name,
      sanitizeCssValue(computedStyle.getPropertyValue(`--${name}`).trim(), fallback[name])
    ])
  ) as ThemeTokens
}

export function createReportThemeCss(
  preference: ReportThemePreference,
  currentThemeIsDark: boolean
): string {
  const fallback = currentThemeIsDark ? DARK_THEME : LIGHT_THEME
  const tokens =
    preference === 'current'
      ? readCurrentTheme(fallback)
      : preference === 'dark'
        ? DARK_THEME
        : LIGHT_THEME

  return `:root {\n${TOKEN_NAMES.map((name) => `  --${name}: ${tokens[name]};`).join('\n')}\n}`
}
