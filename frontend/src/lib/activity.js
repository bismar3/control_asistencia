import { Activity, FileSpreadsheet, Fingerprint, LogIn, Rocket, UserCog } from 'lucide-react'

/** Presentación de cada tipo de acción auditada (RF-09). */
export const ACTION_META = {
  MARCADO_ASISTENCIA: { label: 'Marcado de asistencia', icon: Fingerprint, tone: 'ok' },
  MODIFICACION_ADMIN: { label: 'Modificación administrativa', icon: UserCog, tone: 'warn' },
  ACTIVACION_MODULO: { label: 'Activación de módulo', icon: Rocket, tone: 'accent' },
  IMPORTACION_EXCEL: { label: 'Importación desde Excel', icon: FileSpreadsheet, tone: 'info' },
  LOGIN: { label: 'Inicio de sesión', icon: LogIn, tone: 'neutral' },
  OTRO: { label: 'Otra acción', icon: Activity, tone: 'neutral' },
}

export const ACTION_OPTIONS = Object.entries(ACTION_META).map(([value, meta]) => ({ value, label: meta.label }))

export function actionMeta(accion) {
  return ACTION_META[accion] ?? ACTION_META.OTRO
}
