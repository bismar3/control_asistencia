import styles from './EmptyState.module.css'
import { cx } from '../../lib/cx'

export default function EmptyState({ icon: Icon, title, description, action, tone = 'accent', compact = false, className }) {
  return (
    <div className={cx(styles.empty, compact && styles.compact, className)}>
      {Icon && (
        <span className={cx(styles.icon, styles[tone])} aria-hidden="true">
          <Icon size={compact ? 22 : 28} strokeWidth={2} />
        </span>
      )}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
