import { ThemeManager } from './theme'

export async function defaultPreset(): Promise<string> {
  const themeManager = ThemeManager.getInstance()
  const cssContent = `
/* shadcn-ui START */

:root {
  --background: hsl(0 0% 96%);
  --foreground: hsl(230 8% 10%);
  --muted: hsl(230 12% 81%);
  --muted-foreground: hsl(230 12% 21%);
  --popover: hsl(0 0% 93%);
  --popover-foreground: hsl(230 8% 10%);
  --card: hsl(0 0% 94%);
  --card-foreground: hsl(230 8% 10%);
  --border: hsla(0 0% 91% / 0.7);
  --input: hsl(0 0% 88%);
  --primary: hsl(223 42% 57%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(223 30% 75%);
  --secondary-foreground: hsl(223 30% 15%);
  --accent: hsl(230 8% 70%);
  --accent-foreground: hsl(230 8% 10%);
  --destructive: hsl(2 82% 30%);
  --destructive-foreground: hsl(2 82% 90%);
  --ring: hsl(214 57% 55%);
  --chart-1: hsl(223 42% 57%);
  --chart-2: hsl(223 30% 75%);
  --chart-3: hsl(230 8% 70%);
  --chart-4: hsl(223 30% 78%);
  --chart-5: hsl(223 45% 57%);
  --radius: 0.3rem;
}

.dark {
  --background: hsl(230 24% 19%);
  --foreground: hsl(230 24% 94%);
  --muted: hsl(230 12% 23%);
  --muted-foreground: hsl(230 12% 73%);
  --popover: hsl(230 24% 16%);
  --popover-foreground: hsl(230 24% 94%);
  --card: hsl(230 24% 17%);
  --card-foreground: hsl(230 24% 94%);
  --border: hsla(230 14% 24% / 0.7);
  --input: hsl(230 14% 27%);
  --primary: hsl(223 45% 44%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(223 30% 75%);
  --secondary-foreground: hsl(223 30% 15%);
  --accent: hsl(230 24% 34%);
  --accent-foreground: hsl(230 24% 94%);
  --destructive: hsl(2 80% 58%);
  --destructive-foreground: hsl(0 0% 100%);
  --ring: hsl(223 45% 44%);
  --chart-1: hsl(223 42% 57%);
  --chart-2: hsl(223 30% 75%);
  --chart-3: hsl(230 8% 70%);
  --chart-4: hsl(223 30% 78%);
  --chart-5: hsl(223 45% 57%);
  --radius: 0.3rem;
}

/* shadcn-ui END */
  `.trimStart()
  await themeManager.saveTheme(cssContent)
  return cssContent
}

export async function mutsumiPreset(): Promise<string> {
  const themeManager = ThemeManager.getInstance()
  const cssContent = `
/* shadcn-ui START */

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 20%);
  --muted: hsl(0 12% 90%);
  --muted-foreground: hsl(0 12% 30%);
  --popover: hsl(0 0% 97%);
  --popover-foreground: hsl(0 0% 10%);
  --card: hsl(0 0% 98%);
  --card-foreground: hsl(0 0% 15%);
  --border: hsl(0 0% 95%);
  --input: hsl(0 0% 92%);
  --primary: hsl(174 42% 65%);
  --primary-foreground: hsl(174 42% 5%);
  --secondary: hsl(174 30% 25%);
  --secondary-foreground: hsl(174 30% 85%);
  --accent: hsl(0 0% 85%);
  --accent-foreground: hsl(0 0% 25%);
  --destructive: hsl(2 80% 24%);
  --destructive-foreground: hsl(2 80% 84%);
  --ring: hsl(174 42% 65%);
  --chart-1: hsl(174 42% 65%);
  --chart-2: hsl(174 30% 25%);
  --chart-3: hsl(0 0% 85%);
  --chart-4: hsl(174 30% 28%);
  --chart-5: hsl(174 45% 65%);
  --radius: 0.3rem;
}

.dark {
  --background: hsl(229 20% 20%);
  --foreground: hsl(231 28% 73%);
  --muted: hsl(229 12% 24%);
  --muted-foreground: hsl(229 12% 74%);
  --popover: hsl(229 20% 17%);
  --popover-foreground: hsl(231 28% 83%);
  --card: hsl(229 20% 18%);
  --card-foreground: hsl(231 28% 78%);
  --border: hsl(229 10% 25%);
  --input: hsl(229 10% 28%);
  --primary: hsl(174 42% 65%);
  --primary-foreground: hsl(174 42% 5%);
  --secondary: hsl(174 30% 25%);
  --secondary-foreground: hsl(174 30% 85%);
  --accent: hsl(229 20% 35%);
  --accent-foreground: hsl(229 20% 95%);
  --destructive: hsl(10 91% 58%);
  --destructive-foreground: hsl(0 0% 0%);
  --ring: hsl(174 42% 65%);
  --chart-1: hsl(174 42% 65%);
  --chart-2: hsl(174 30% 25%);
  --chart-3: hsl(229 20% 35%);
  --chart-4: hsl(174 30% 28%);
  --chart-5: hsl(174 45% 65%);
  --radius: 0.3rem;
}

/* shadcn-ui END */
  `.trimStart()
  await themeManager.saveTheme(cssContent)
  return cssContent
}

export async function moonlightPreset(): Promise<string> {
  const themeManager = ThemeManager.getInstance()
  const cssContent = `
/* shadcn-ui START */

:root {
  --background: hsl(0 0% 96%);
  --foreground: hsl(0 0% 20%);
  --muted: hsl(0 12% 90%);
  --muted-foreground: hsl(0 12% 30%);
  --popover: hsl(0 0% 93%);
  --popover-foreground: hsl(0 0% 10%);
  --card: hsl(0 0% 94%);
  --card-foreground: hsl(0 0% 15%);
  --border: hsl(0 0% 91%);
  --input: hsl(0 0% 88%);
  --primary: hsl(214 57% 55%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(214 30% 75%);
  --secondary-foreground: hsl(214 30% 15%);
  --accent: hsl(0 0% 81%);
  --accent-foreground: hsl(0 0% 21%);
  --destructive: hsl(1 85% 44%);
  --destructive-foreground: hsl(0 0% 100%);
  --ring: hsl(214 57% 55%);
  --chart-1: hsl(214 57% 55%);
  --chart-2: hsl(214 30% 75%);
  --chart-3: hsl(0 0% 81%);
  --chart-4: hsl(214 30% 78%);
  --chart-5: hsl(214 60% 55%);
  --radius: 0.3rem;
}

.dark {
  --background: hsl(234 23% 17%);
  --foreground: hsl(225 69% 87%);
  --muted: hsl(234 12% 21%);
  --muted-foreground: hsl(234 12% 71%);
  --popover: hsl(234 23% 14%);
  --popover-foreground: hsl(225 69% 97%);
  --card: hsl(234 23% 15%);
  --card-foreground: hsl(225 69% 92%);
  --border: hsl(234 13% 22%);
  --input: hsl(234 13% 25%);
  --primary: hsl(217 100% 74%);
  --primary-foreground: hsl(217 100% 14%);
  --secondary: hsl(217 30% 25%);
  --secondary-foreground: hsl(217 30% 85%);
  --accent: hsl(234 23% 32%);
  --accent-foreground: hsl(234 23% 92%);
  --destructive: hsl(5 93% 48%);
  --destructive-foreground: hsl(0 0% 100%);
  --ring: hsl(217 100% 74%);
  --chart-1: hsl(217 100% 74%);
  --chart-2: hsl(217 30% 25%);
  --chart-3: hsl(234 23% 32%);
  --chart-4: hsl(217 30% 28%);
  --chart-5: hsl(217 103% 74%);
  --radius: 0.3rem;
}

/* shadcn-ui END */
  `.trimStart()
  await themeManager.saveTheme(cssContent)
  return cssContent
}
