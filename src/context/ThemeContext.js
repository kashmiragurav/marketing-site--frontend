'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

// Read theme from cookie (works on first paint, no flash)
function getInitialDark() {
  if (typeof document === 'undefined') return false
  const match = document.cookie.match(/(?:^|;\s*)cartx_theme=([^;]*)/)
  if (match) return match[1] === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }) {
  const [dark, setDark]       = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const isDark = getInitialDark()
    setDark(isDark)
    // Apply class immediately to avoid flash
    document.documentElement.classList.toggle('dark', isDark)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', dark)
    // Persist in cookie (30-day, SameSite=Lax, no Secure needed for theme)
    document.cookie = `cartx_theme=${dark ? 'dark' : 'light'};max-age=${60 * 60 * 24 * 30};path=/;SameSite=Lax`
  }, [dark, mounted])

  const toggleTheme = () => setDark(prev => !prev)

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
