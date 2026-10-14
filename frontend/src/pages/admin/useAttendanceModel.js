import { useCallback, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { CLASES_MODULO, MODULO_ACTIVO } from '../../graphql/modulo'
import { REPORTE_GENERAL } from '../../graphql/asistencia'
import { useToday } from '../../hooks/useNow'
import { buildAttendanceModel } from '../../lib/attendance'

/**
 * Datos del módulo activo para el panel administrativo:
 * módulo + clases + matriz de asistencia (reporteGeneralAsistencias) → modelo con totales.
 */
export function useAttendanceModel({ pollInterval } = {}) {
  const today = useToday()
  const moduloQuery = useQuery(MODULO_ACTIVO)
  const modulo = moduloQuery.data?.moduloActivo ?? null
  const hasModule = Boolean(modulo)

  const clasesQuery = useQuery(CLASES_MODULO, { skip: !hasModule })
  const reporteQuery = useQuery(REPORTE_GENERAL, {
    skip: !hasModule,
    pollInterval,
    notifyOnNetworkStatusChange: false,
  })

  const clases = clasesQuery.data?.clasesModulo
  const filas = reporteQuery.data?.reporteGeneralAsistencias

  const model = useMemo(() => buildAttendanceModel(clases ?? [], filas ?? [], today), [clases, filas, today])

  const moduleResolved = Boolean(moduloQuery.data)
  const ready = moduleResolved && (!hasModule || (Boolean(clases) && Boolean(filas)))
  const error = moduloQuery.error ?? clasesQuery.error ?? reporteQuery.error

  const { refetch: refetchModulo } = moduloQuery
  const { refetch: refetchClases } = clasesQuery
  const { refetch: refetchReporte } = reporteQuery
  const refetch = useCallback(async () => {
    await refetchModulo()
    if (hasModule) await Promise.all([refetchClases(), refetchReporte()])
  }, [hasModule, refetchModulo, refetchClases, refetchReporte])

  return {
    modulo,
    model,
    today,
    ready,
    loading: !ready && !error,
    refreshing: reporteQuery.loading && Boolean(filas),
    error,
    refetch,
  }
}
