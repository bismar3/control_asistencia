import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · CODERS Asistencia` : 'Control de Asistencia · CODERS'
  }, [title])
}
