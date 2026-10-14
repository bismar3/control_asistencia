import { useCallback, useMemo, useRef, useState } from 'react'
import Toaster from '../components/ui/Toaster'
import { ToastContext } from './toast-context'

const DEFAULT_TITLES = {
  success: 'Listo',
  error: 'Algo salió mal',
  warning: 'Atención',
  info: 'Información',
}

const MAX_VISIBLE = 4

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const sequence = useRef(0)

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const dismiss = useCallback(
    (id) => {
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)))
      window.setTimeout(() => remove(id), 280)
    },
    [remove],
  )

  const show = useCallback(
    (type, message, options = {}) => {
      sequence.current += 1
      const id = `toast-${sequence.current}`
      const toast = { id, type, message, title: options.title ?? DEFAULT_TITLES[type] }
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), toast])
      const duration = options.duration ?? (type === 'error' ? 6500 : 4200)
      window.setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show('success', message, options),
      error: (message, options) => show('error', message, options),
      warning: (message, options) => show('warning', message, options),
      info: (message, options) => show('info', message, options),
    }),
    [show, dismiss],
  )

  return (
    <ToastContext value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext>
  )
}
