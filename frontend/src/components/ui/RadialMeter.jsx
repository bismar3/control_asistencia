import styles from './RadialMeter.module.css'
import { useCountUp } from '../../hooks/useCountUp'
import { severityOf } from '../../lib/attendance'
import { cx } from '../../lib/cx'

/**
 * Medidor radial de un porcentaje (estilo anillos de actividad).
 * El relleno indica la severidad y la pista es un tono claro del mismo color.
 */
export default function RadialMeter({ value, size = 168, stroke = 14, label, caption, tone, className }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const percent = value == null ? 0 : Math.max(0, Math.min(100, value))
  const severity = tone ?? severityOf(value)
  const animated = useCountUp(value ?? 0)

  return (
    <div
      className={cx(styles.meter, styles[severity], className)}
      style={{ '--size': `${size}px`, '--circumference': circumference }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
      aria-label={label ?? 'Porcentaje'}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className={styles.track} cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className={styles.progress}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.value}>
          {value == null ? '—' : Math.round(animated)}
          {value != null && <small>%</small>}
        </span>
        {label && <span className={styles.label}>{label}</span>}
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>
    </div>
  )
}
