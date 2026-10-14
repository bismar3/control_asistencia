import { createContext, use } from 'react'

export const ThemeContext = createContext(null)

/** { preference: 'light'|'dark'|'system', theme: 'light'|'dark', setPreference(), toggle(event) } */
export function useTheme() {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return context
}
