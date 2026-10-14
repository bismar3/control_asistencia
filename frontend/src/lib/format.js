import { LOCALE } from '../config'

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

/** Mayúscula solo en la primera letra ("miércoles, 14 de octubre" → "Miércoles, 14 de octubre"). */
export function capitalize(text = '') {
  return text ? text.charAt(0).toLocaleUpperCase('es') + text.slice(1) : text
}

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] ?? ''
}

export function formatNumber(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatPercent(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${formatNumber(value, digits)}%`
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Minúsculas y sin tildes, para búsquedas locales. */
export function normalizeText(text = '') {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Índice estable (0..n-1) a partir de un texto; se usa para colorear avatares. */
export function hashIndex(text = '', modulo = 8) {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return hash % modulo
}

export function slugify(text = '') {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
