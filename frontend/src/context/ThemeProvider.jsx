import { useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { STORAGE_KEYS } from '../config'
import { ThemeContext } from './theme-context'

const THEME_COLORS = { light: '#eef2f9', dark: '#050914' }
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function readPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.theme)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference)
  const [systemDark, setSystemDark] = useState(() => darkQuery().matches)

  useEffect(() => {
    const query = darkQuery()
    const onChange = (event) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setPreference = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next)
    } catch {
      /* almacenamiento no disponible: el tema solo dura la sesión */
    }
    setPreferenceState(next)
  }, [])

  /**
   * Alterna claro/oscuro con una revelación circular desde el punto del clic
   * (View Transitions API). Si el navegador no la soporta, cambia al instante.
   */
  const toggle = useCallback(
    (event) => {
      const next = theme === 'dark' ? 'light' : 'dark'
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!document.startViewTransition || reduceMotion) {
        setPreference(next)
        return
      }

      const x = event?.clientX ?? window.innerWidth - 40
      const y = event?.clientY ?? 40
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      const root = document.documentElement
      root.classList.add('theme-transition')

      const transition = document.startViewTransition(() => {
        flushSync(() => setPreference(next))
        applyTheme(next)
      })

      transition.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
          )
        })
        .catch(() => {})
      transition.finished.finally(() => root.classList.remove('theme-transition'))
    },
    [theme, setPreference],
  )

  const value = useMemo(() => ({ preference, theme, setPreference, toggle }), [preference, theme, setPreference, toggle])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
