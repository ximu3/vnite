import { ThemeManager } from './common'

export async function defaultPreset(): Promise<string> {
  const themeManager = await ThemeManager.getInstance()
  const cssContent = `
/* shadcn-ui START */

@layer base {
  :root {
    --background: 230 8% 85%;
    --foreground: 229 26% 28%;
    --muted: 230 12% 81%;
    --muted-foreground: 230 12% 21%;
    --popover: 230 8% 82%;
    --popover-foreground: 229 26% 18%;
    --card: 230 8% 83%;
    --card-foreground: 229 26% 23%;
    --border: 0 0% 80%;
    --input: 0 0% 77%;
    --primary: 223 42% 57%;
    --primary-foreground: 0 0% 100%;
    --secondary: 223 30% 75%;
    --secondary-foreground: 223 30% 15%;
    --accent: 230 8% 70%;
    --accent-foreground: 230 8% 10%;
    --destructive: 2 82% 30%;
    --destructive-foreground: 2 82% 90%;
    --ring: 223 42% 57%;
    --chart-1: 223 42% 57%;
    --chart-2: 223 30% 75%;
    --chart-3: 230 8% 70%;
    --chart-4: 223 30% 78%;
    --chart-5: 223 45% 57%;
    --radius: 0.3rem;
  }

  .dark {
    --background: 230 24% 19%;
    --foreground: 229 35% 75%;
    --muted: 230 12% 23%;
    --muted-foreground: 230 12% 73%;
    --popover: 230 24% 16%;
    --popover-foreground: 229 35% 85%;
    --card: 230 24% 17%;
    --card-foreground: 229 35% 80%;
    --border: 230 14% 24%;
    --input: 230 14% 27%;
    --primary: 223 45% 44%;
    --primary-foreground: 0 0% 100%;
    --secondary: 223 30% 75%;
    --secondary-foreground: 223 30% 15%;
    --accent: 230 24% 34%;
    --accent-foreground: 230 24% 94%;
    --destructive: 2 80% 58%;
    --destructive-foreground: 0 0% 100%;
    --ring: 223 45% 44%;
    --radius: 0.3rem;
  }
}

/* shadcn-ui END */
  `.trimStart()
  await themeManager.saveTheme(cssContent)
  return cssContent
}

export async function mutsumiPreset(): Promise<string> {
  const themeManager = await ThemeManager.getInstance()
  const cssContent = `
/* shadcn-ui START */

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 20%;
    --muted: 0 12% 90%;
    --muted-foreground: 0 12% 30%;
    --popover: 0 0% 97%;
    --popover-foreground: 0 0% 10%;
    --card: 0 0% 98%;
    --card-foreground: 0 0% 15%;
    --border: 0 0% 95%;
    --input: 0 0% 92%;
    --primary: 174 42% 65%;
    --primary-foreground: 174 42% 5%;
    --secondary: 174 30% 25%;
    --secondary-foreground: 174 30% 85%;
    --accent: 0 0% 85%;
    --accent-foreground: 0 0% 25%;
    --destructive: 2 80% 24%;
    --destructive-foreground: 2 80% 84%;
    --ring: 174 42% 65%;
    --chart-1: 174 42% 65%;
    --chart-2: 174 30% 25%;
    --chart-3: 0 0% 85%;
    --chart-4: 174 30% 28%;
    --chart-5: 174 45% 65%;
    --radius: 0.3rem;
  }

  .dark {
    --background: 229 20% 20%;
    --foreground: 231 28% 73%;
    --muted: 229 12% 24%;
    --muted-foreground: 229 12% 74%;
    --popover: 229 20% 17%;
    --popover-foreground: 231 28% 83%;
    --card: 229 20% 18%;
    --card-foreground: 231 28% 78%;
    --border: 229 10% 25%;
    --input: 229 10% 28%;
    --primary: 174 42% 65%;
    --primary-foreground: 174 42% 5%;
    --secondary: 174 30% 25%;
    --secondary-foreground: 174 30% 85%;
    --accent: 229 20% 35%;
    --accent-foreground: 229 20% 95%;
    --destructive: 10 91% 58%;
    --destructive-foreground: 0 0% 0%;
    --ring: 174 42% 65%;
    --chart-1: 174 42% 65%;
    --chart-2: 174 30% 25%;
    --chart-3: 229 20% 35%;
    --chart-4: 174 30% 28%;
    --chart-5: 174 45% 65%;
    --radius: 0.3rem;
  }
}

/* shadcn-ui END */
  `.trimStart()
  await themeManager.saveTheme(cssContent)
  return cssContent
}
