import styles from './StatTile.module.css'
import Skeleton from './Skeleton'
import { useCountUp } from '../../hooks/useCountUp'
import { cx } from '../../lib/cx'
import { formatNumber } from '../../lib/format'

/** Indicador: etiqueta · valor (animado) · pista opcional · contenido extra (p. ej. barra). */
export default function StatTile({
  label,
  value,
  suffix,
  digits = 0,
  icon: Icon,
  tone = 'accent',
  hint,
  loading = false,
  index = 0,
  children,
  className,
}) {
  const numeric = typeof value === 'number' && Number.isFinite(value)
  const animated = useCountUp(numeric ? value : null)

  return (
    <div className={cx('glass', styles.tile, styles[tone], 'anim-fade-up', className)} style={{ '--i': index }}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        {Icon && (
          <span className={styles.icon} aria-hidden="true">
            <Icon size={18} strokeWidth={2.2} />
          </span>
        )}
      </div>
      <div className={styles.value}>
        {loading ? (
          <Skeleton width={90} height={34} radius={10} />
        ) : numeric ? (
          <>
            {formatNumber(animated, digits)}
            {suffix && <span className={styles.suffix}>{suffix}</span>}
          </>
        ) : (
          (value ?? '—')
        )}
      </div>
      {hint && <div className={styles.hint}>{hint}</div>}
      {children}
    </div>
  )
}
