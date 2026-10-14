import { APP_TIMEZONE, LOCALE } from '../config'
import { capitalize } from './format'

/*
 * El backend envía las fechas como 'YYYY-MM-DD' (Date) y 'HH:MM:SS' (Time).
 * new Date('2026-10-14') se interpreta en UTC y en Bolivia (UTC-4) mostraría el día anterior,
 * por eso las fechas se construyen siempre con sus partes locales.
 */

const formatters = new Map()
function formatter(options) {
  const key = JSON.stringify(options)
  if (!formatters.has(key)) formatters.set(key, new Intl.DateTimeFormat(LOCALE, options))
  return formatters.get(key)
}

const isoInZone = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Fecha 'YYYY-MM-DD' de un instante, vista en la zona horaria del backend. */
export function toZonedISODate(date) {
  return isoInZone.format(date)
}

/** Fecha-hora ISO del servidor → 'YYYY-MM-DD' en la zona horaria del backend. */
export function zonedDateOf(isoDateTime) {
  return toZonedISODate(new Date(isoDateTime))
}

/** 'YYYY-MM-DD' → Date local a medianoche. */
export function parseISODate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date local → 'YYYY-MM-DD'. */
export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysBetween(fromISO, toISO) {
  return Math.round((parseISODate(toISO) - parseISODate(fromISO)) / 86_400_000)
}

/** Ubica una fecha de clase respecto a hoy: 'pasada' | 'hoy' | 'futura'. */
export function getTiming(dateISO, todayISO) {
  if (dateISO < todayISO) return 'pasada'
  if (dateISO === todayISO) return 'hoy'
  return 'futura'
}

const stripDot = (text) => text.replace(/\./g, '')

export function formatDate(iso, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = parseISODate(iso)
  return date ? stripDot(formatter(options).format(date)) : '—'
}

/** martes, 14 de octubre de 2026 */
export const formatDateLong = (iso) =>
  formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** mar, 14 oct */
export const formatDateMedium = (iso) => formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short' })

/** 14 oct 2026 */
export const formatDateShort = (iso) => formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' })

/** 14/10 */
export const formatDayMonth = (iso) => formatDate(iso, { day: '2-digit', month: '2-digit' })

export const formatWeekday = (iso) => formatDate(iso, { weekday: 'short' })
export const formatMonthShort = (iso) => formatDate(iso, { month: 'short' })
export const formatMonthYear = (iso) => formatDate(iso, { month: 'long', year: 'numeric' })

/** 'HH:MM:SS' → 'HH:MM' */
export function formatTime(time) {
  return time ? time.slice(0, 5) : ''
}

export function formatTimeRange(start, end) {
  if (!start && !end) return 'Horario por definir'
  return [formatTime(start), formatTime(end)].filter(Boolean).join(' – ')
}

/** Fecha-hora ISO del servidor → texto en la zona horaria del backend. */
export function formatDateTime(iso, options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) {
  if (!iso) return '—'
  return stripDot(formatter({ ...options, timeZone: APP_TIMEZONE, hourCycle: 'h23' }).format(new Date(iso)))
}

export function formatClock(date) {
  return formatter({
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

export function formatZonedDateLong(date) {
  return formatter({ timeZone: APP_TIMEZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function hourInZone(date) {
  return Number(formatter({ timeZone: APP_TIMEZONE, hour: 'numeric', hourCycle: 'h23' }).format(date))
}

export function greetingFor(date) {
  const hour = hourInZone(date)
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Hoy, Mañana, En 3 días, Hace 2 días… */
export function relativeDay(dateISO, todayISO) {
  const diff = daysBetween(todayISO, dateISO)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  if (diff > 1) return `En ${diff} días`
  return `Hace ${-diff} días`
}

/**
 * Celdas de un calendario mensual que empieza en lunes.
 * month: 'YYYY-MM' → [{ iso, day, inMonth }] (5 o 6 semanas completas).
 */
export function monthGrid(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const first = new Date(year, monthNumber - 1, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  const weeks = Math.ceil((offset + daysInMonth) / 7)
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(year, monthNumber - 1, 1 - offset + index)
    return { iso: toISODate(date), day: date.getDate(), inMonth: date.getMonth() === monthNumber - 1 }
  })
}

export function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(year, monthNumber - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Etiqueta para agrupar por día en listas de actividad. */
export function dayGroupLabel(dateISO, todayISO) {
  const diff = daysBetween(todayISO, dateISO)
  if (diff === 0) return 'Hoy'
  if (diff === -1) return 'Ayer'
  return capitalize(formatDateLong(dateISO))
}
