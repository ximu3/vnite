import React, { createContext, useContext, useEffect, useState } from 'react'
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'

const ThemeContext = createContext<{
  theme: string | null
  updateTheme: (css: string) => void
  toggleTheme: () => void
  isDark: boolean
}>({
  theme: null,
  updateTheme: () => {},
  toggleTheme: () => {},
  isDark: true
})

export const ThemeProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [theme, setTheme] = useState<string | null>(null)
  const [isDark, setIsDark] = useState<boolean>(() => {
    // 从 localStorage 中获取用户的主题选择
    const savedThemeMode = localStorage.getItem('theme-mode')
    return savedThemeMode ? savedThemeMode === 'dark' : true // 默认暗色模式
  })

  useEffect(() => {
    ipcInvoke('load-theme').then((savedTheme) => {
      if (savedTheme) {
        setTheme(savedTheme as string)
        applyTheme(savedTheme as string)
      } else {
        toast.error('Failed to load theme')
      }
    })

    // 应用用户选择的主题模式
    updateThemeMode(isDark)
  }, [isDark])

  const updateTheme = async (css: string): Promise<void> => {
    await ipcInvoke('save-theme', css)
    setTheme(css)
    applyTheme(css)
  }

  const updateThemeMode = (dark: boolean): void => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // 保存用户的主题选择到 localStorage
    localStorage.setItem('theme-mode', dark ? 'dark' : 'light')
  }

  const toggleTheme = (): void => {
    setIsDark((prevIsDark) => !prevIsDark)
  }

  const applyTheme = (css: string): void => {
    let styleEl = document.getElementById('custom-theme')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'custom-theme'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): {
  theme: string | null
  updateTheme: (css: string) => void
  toggleTheme: () => void
  isDark: boolean
} => useContext(ThemeContext)
