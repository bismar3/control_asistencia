import styles from './StatusBadge.module.css'
import { STATUS } from '../../lib/attendance'
import { cx } from '../../lib/cx'

/** Estado de asistencia con ícono + texto (nunca solo color). */
export default function StatusBadge({ status, size = 'md', label, className }) {
  const meta = STATUS[status] ?? STATUS.programada
  const Icon = meta.icon
  return (
    <span className={cx(styles.badge, styles[meta.tone], styles[size], className)}>
      <Icon size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} strokeWidth={2.4} aria-hidden="true" />
      {label ?? meta.label}
    </span>
  )
}

/** Insignia genérica con tono (ok, bad, warn, info, neutral, accent). */
export function Tag({ tone = 'neutral', icon: Icon, size = 'md', className, children }) {
  return (
    <span className={cx(styles.badge, styles[tone], styles[size], className)}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  )
}
