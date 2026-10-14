import { createContext, use } from 'react'

export const ToastContext = createContext(null)

/** toast.success(mensaje, { title }) · toast.error · toast.warning · toast.info (RF-18) */
export function useToast() {
  const context = use(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return context
}
