/** Configuración global de la aplicación (valores sobreescribibles con variables VITE_*). */

export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || '/graphql/'

/** Debe coincidir con settings.TIME_ZONE del backend: define qué día es "hoy". */
export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'America/La_Paz'

export const LOCALE = 'es-BO'

export const APP_VERSION = '1.0.0'

/** Porcentaje de asistencia considerado saludable (se usa para los colores de los indicadores). */
export const ATTENDANCE_GOAL = 80
export const ATTENDANCE_WARNING = 60

export const STORAGE_KEYS = {
  session: 'coders.asistencia.session',
  theme: 'coders.theme',
}
