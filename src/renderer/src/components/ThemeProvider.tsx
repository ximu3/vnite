import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ipcInvoke } from '~/utils'

const ThemeContext = createContext<{
  theme: string | null
  updateTheme: (css: string) => void
  toggleTheme: () => void
  isDark: boolean
  themeSetting: 'dark' | 'light' | 'follow-system'
  setThemeSetting: React.Dispatch<React.SetStateAction<'dark' | 'light' | 'follow-system'>>
}>({
  theme: null,
  updateTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
  themeSetting: 'dark',
  setThemeSetting: () => {}
})

export const ThemeProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [theme, setTheme] = useState<string | null>(null)
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Get user's theme selection from localStorage
    const savedThemeMode = localStorage.getItem('theme-mode')
    return savedThemeMode ? savedThemeMode === 'dark' : true // Default dark mode
  })

  const [themeSetting, setThemeSetting] = useState<'dark' | 'light' | 'follow-system'>(() => {
    const savedThemeSetting = localStorage.getItem('theme-setting')
    if (
      savedThemeSetting === 'dark' ||
      savedThemeSetting === 'light' ||
      savedThemeSetting === 'follow-system'
    ) {
      return savedThemeSetting
    } else {
      const savedThemeMode = localStorage.getItem('theme-mode')
      return savedThemeMode === 'light' ? 'light' : 'dark'
    }
  })

  useEffect(() => {
    localStorage.setItem('theme-setting', themeSetting)
    if (themeSetting === 'follow-system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsDark(mediaQuery.matches)

      const handleSystemThemeChange = (e: MediaQueryListEvent): void => setIsDark(e.matches)
      mediaQuery.addEventListener('change', handleSystemThemeChange)

      return (): void => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    } else {
      setIsDark(themeSetting === 'dark')
      return (): void => {}
    }
  }, [themeSetting])

  useEffect(() => {
    ipcInvoke('load-theme').then((savedTheme) => {
      if (savedTheme) {
        setTheme(savedTheme as string)
        applyTheme(savedTheme as string)
      } else {
        toast.error('Failed to load theme')
      }
    })

    // Apply user-selected theme patterns
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
    // Save the user's topic selection to localStorage
    localStorage.setItem('theme-mode', dark ? 'dark' : 'light')
  }

  const toggleTheme = (): void => {
    setThemeSetting(isDark ? 'light' : 'dark')
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
    <ThemeContext.Provider
      value={{ theme, updateTheme, toggleTheme, isDark, themeSetting, setThemeSetting }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): {
  theme: string | null
  updateTheme: (css: string) => void
  toggleTheme: () => void
  isDark: boolean
  themeSetting: 'dark' | 'light' | 'follow-system'
  setThemeSetting: React.Dispatch<React.SetStateAction<'dark' | 'light' | 'follow-system'>>
} => useContext(ThemeContext)
