import styles from './Spinner.module.css'
import { cx } from '../../lib/cx'

export default function Spinner({ size = 18, className, label }) {
  return (
    <span className={cx(styles.spinner, className)} style={{ '--size': `${size}px` }} role={label ? 'status' : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle className={styles.track} cx="12" cy="12" r="9.5" />
        <circle className={styles.arc} cx="12" cy="12" r="9.5" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
