import { CalendarClock, CircleCheck, CircleX, Clock3, ShieldCheck } from 'lucide-react'
import { ATTENDANCE_GOAL, ATTENDANCE_WARNING } from '../config'
import { getTiming } from './dates'

export const ESTADO = {
  PRESENTE: 'PRESENTE',
  FALTA: 'FALTA',
  JUSTIFICADO: 'JUSTIFICADO',
}

/** Estados visuales: combinan el estado guardado con la fecha de la clase (RN-04, RN-05). */
export const STATUS = {
  presente: { label: 'Presente', short: 'P', icon: CircleCheck, tone: 'ok' },
  falta: { label: 'Falta', short: 'F', icon: CircleX, tone: 'bad' },
  justificado: { label: 'Justificado', short: 'J', icon: ShieldCheck, tone: 'warn' },
  pendiente: { label: 'Sin marcar', short: '·', icon: Clock3, tone: 'info' },
  programada: { label: 'Programada', short: '–', icon: CalendarClock, tone: 'neutral' },
}

/** Opciones que el administrador puede asignar manualmente. */
export const EDITABLE_STATES = [
  { value: ESTADO.PRESENTE, label: 'Presente', icon: CircleCheck, tone: 'ok' },
  { value: ESTADO.FALTA, label: 'Falta', icon: CircleX, tone: 'bad' },
  { value: ESTADO.JUSTIFICADO, label: 'Justificado', icon: ShieldCheck, tone: 'warn' },
]

/**
 * Traduce el estado almacenado a un estado visual.
 * - Una clase pasada sin marca es Falta (RN-05).
 * - Hoy, mientras no exista marca, la asistencia está pendiente.
 * - Las clases futuras están programadas (salvo justificaciones anticipadas).
 * `explicit` indica que un administrador fijó el valor manualmente.
 */
export function resolveStatus(estado, timing, { explicit = false } = {}) {
  if (estado === ESTADO.PRESENTE) return 'presente'
  if (estado === ESTADO.JUSTIFICADO) return 'justificado'
  if (timing === 'pasada') return 'falta'
  if (timing === 'hoy') return explicit && estado === ESTADO.FALTA ? 'falta' : 'pendiente'
  return 'programada'
}

/** Estado guardado equivalente a un estado visual (para preseleccionar en formularios). */
export function statusToEstado(status) {
  if (status === 'presente') return ESTADO.PRESENTE
  if (status === 'justificado') return ESTADO.JUSTIFICADO
  return ESTADO.FALTA
}

/** Totales de una lista de estados visuales. El porcentaje considera solo clases ya evaluadas. */
export function summarize(statuses) {
  const totals = { presente: 0, falta: 0, justificado: 0, pendiente: 0, programada: 0 }
  for (const status of statuses) totals[status] += 1
  const evaluadas = totals.presente + totals.falta + totals.justificado
  return {
    ...totals,
    total: statuses.length,
    evaluadas,
    porcentaje: evaluadas ? Math.round((totals.presente / evaluadas) * 1000) / 10 : null,
  }
}

export function severityOf(percent) {
  if (percent == null) return 'neutral'
  if (percent >= ATTENDANCE_GOAL) return 'ok'
  if (percent >= ATTENDANCE_WARNING) return 'warn'
  return 'bad'
}

/** Nombre visible de una clase: los nombres genéricos ("Clase 3") se renumeran por orden cronológico. */
export function classLabel(nombre, position) {
  const generic = !nombre || /^clase\s+\d+$/i.test(nombre.trim())
  return generic ? `Clase ${position}` : nombre
}

export function sortClasses(clases) {
  return [...clases].sort(
    (a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada) || (a.orden ?? 0) - (b.orden ?? 0),
  )
}

/** Clases del módulo enriquecidas con posición, etiqueta y ubicación temporal. */
export function decorateClasses(clases, todayISO) {
  return sortClasses(clases).map((clase, index) => ({
    ...clase,
    id: String(clase.id),
    position: index + 1,
    label: classLabel(clase.nombre, index + 1),
    timing: getTiming(clase.fechaProgramada, todayISO),
  }))
}

/** Lee campos JSONString de graphene sin romper la interfaz si llegan vacíos o mal formados. */
export function parseJSON(value, fallback) {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

/**
 * Modelo completo de asistencia del módulo a partir de `clasesModulo` y `reporteGeneralAsistencias`.
 * Devuelve clases con totales por fecha, estudiantes con sus celdas y el resumen global.
 */
export function buildAttendanceModel(clases = [], filas = [], todayISO) {
  const classes = decorateClasses(clases, todayISO)

  const students = filas
    .filter((fila) => fila?.estudiante)
    .map((fila) => {
      const registros = parseJSON(fila.asistenciasPorClase, {})
      const cells = classes.map((clase) => {
        const registro = registros[clase.id] ?? null
        const estado = registro?.estado ?? null
        return {
          claseId: clase.id,
          estado,
          hora: registro?.hora ?? null,
          status: resolveStatus(estado, clase.timing),
        }
      })
      return {
        ...fila.estudiante,
        id: String(fila.estudiante.id),
        cells,
        summary: summarize(cells.map((cell) => cell.status)),
      }
    })

  const totalStudents = students.length
  const classesWithStats = classes.map((clase, index) => {
    const summary = summarize(students.map((student) => student.cells[index].status))
    const rate =
      clase.timing === 'futura' || totalStudents === 0
        ? null
        : Math.round((summary.presente / totalStudents) * 1000) / 10
    return { ...clase, summary, rate }
  })

  const overall = summarize(students.flatMap((student) => student.cells.map((cell) => cell.status)))

  return { classes: classesWithStats, students, overall, totalStudents }
}
