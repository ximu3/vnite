import React, { createContext, useContext, useEffect, useState } from 'react'
import { ipcInvoke } from '~/utils'

const ThemeContext = createContext<{
  theme: string | null
  updateTheme: (css: string) => void
}>({
  theme: null,
  updateTheme: () => {}
})

export const ThemeProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [theme, setTheme] = useState<string | null>(null)

  useEffect(() => {
    // 初始加载主题
    ipcInvoke('load-theme').then((savedTheme) => {
      if (savedTheme) {
        setTheme(savedTheme as string)
        applyTheme(savedTheme as string)
      } else {
        const defaultTheme = `
/* shadcn-ui START */

@layer base {
  :root {
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
        // 默认主题
        updateTheme(defaultTheme)
      }
    })
  }, [])

  const updateTheme = async (css: string): Promise<void> => {
    await ipcInvoke('save-theme', css)
    setTheme(css)
    applyTheme(css)
  }

  const applyTheme = (css: string): void => {
    // 创建或更新样式标签
    let styleEl = document.getElementById('custom-theme')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'custom-theme'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css
  }

  return <ThemeContext.Provider value={{ theme, updateTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): {
  theme: string | null
  updateTheme: (css: string) => void
} => useContext(ThemeContext)
