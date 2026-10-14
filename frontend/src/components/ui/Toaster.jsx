import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import styles from './Toaster.module.css'
import { cx } from '../../lib/cx'

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
}

/** Notificaciones con forma de "Dynamic Island": aparecen arriba al centro y se expanden. */
export default function Toaster({ toasts, onDismiss }) {
  return (
    <div className={styles.region} aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] ?? Info
        return (
          <button
            key={toast.id}
            type="button"
            className={cx(styles.toast, styles[toast.type], toast.leaving && styles.leaving)}
            onClick={() => onDismiss(toast.id)}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <span className={styles.icon} aria-hidden="true">
              <Icon size={19} strokeWidth={2.4} />
            </span>
            <span className={styles.text}>
              <strong className={styles.title}>{toast.title}</strong>
              {toast.message && <span className={styles.message}>{toast.message}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
