import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { MI_HISTORIAL } from '../../graphql/asistencia'
import { useToday } from '../../hooks/useNow'
import { classLabel, resolveStatus, summarize } from '../../lib/attendance'
import { getTiming } from '../../lib/dates'

/**
 * Historial del estudiante (RF-05) enriquecido con estado visual, etiqueta y resumen.
 * Se refresca cada minuto para habilitar el botón en cuanto empieza el día de clase.
 */
export function useStudentAttendance(estudianteId, { pollInterval = 60_000 } = {}) {
  const today = useToday()
  const query = useQuery(MI_HISTORIAL, {
    variables: { estudianteId },
    skip: !estudianteId,
    pollInterval,
    notifyOnNetworkStatusChange: false,
  })

  const resumen = query.data?.miHistorialAsistencia ?? null

  const items = useMemo(() => {
    const historial = [...(resumen?.historial ?? [])].sort((a, b) =>
      a.fechaProgramada.localeCompare(b.fechaProgramada),
    )
    return historial.map((item, index) => {
      const timing = item.esHoy ? 'hoy' : getTiming(item.fechaProgramada, today)
      return {
        ...item,
        position: index + 1,
        label: classLabel(item.claseNombre, index + 1),
        timing,
        status: resolveStatus(item.estado, timing),
      }
    })
  }, [resumen, today])

  const summary = useMemo(() => summarize(items.map((item) => item.status)), [items])
  const todayItem = items.find((item) => item.timing === 'hoy') ?? null
  const upcoming = items.filter((item) => item.timing === 'futura')
  const elapsed = items.filter((item) => item.timing !== 'futura').length

  return { ...query, resumen, items, summary, todayItem, upcoming, elapsed, today }
}
