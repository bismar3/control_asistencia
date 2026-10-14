import { useEffect, useState } from 'react'
import { toZonedISODate } from '../lib/dates'

/** Fecha/hora actual que se actualiza en cada intervalo. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/** "Hoy" (YYYY-MM-DD) en la zona horaria del backend; se recalcula cada 30 s por si cambia el día. */
export function useToday() {
  const now = useNow(30_000)
  return toZonedISODate(now)
}
