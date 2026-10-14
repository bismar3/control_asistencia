import styles from './ProgressBar.module.css'
import { cx } from '../../lib/cx'

/** Barra de progreso (medidor lineal) con pista del mismo tono. */
export default function ProgressBar({ value, max = 100, tone = 'accent', size = 'md', label, className }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div
      className={cx(styles.bar, styles[tone], styles[size], className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <span className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  )
}
