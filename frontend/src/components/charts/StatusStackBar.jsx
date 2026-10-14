import { CircleCheck, CircleX, ShieldCheck } from 'lucide-react'
import styles from './StatusStackBar.module.css'
import { formatPercent } from '../../lib/format'
import { cx } from '../../lib/cx'

/**
 * Barra 100% apilada (parte de un todo) de los estados evaluados.
 * Orden validado para daltonismo: Presentes · Justificados · Faltas, separados por un hueco de 2px.
 */
export default function StatusStackBar({ summary }) {
  const segments = [
    { key: 'presente', label: 'Presentes', value: summary.presente, tone: 'ok', icon: CircleCheck },
    { key: 'justificado', label: 'Justificados', value: summary.justificado, tone: 'warn', icon: ShieldCheck },
    { key: 'falta', label: 'Faltas', value: summary.falta, tone: 'bad', icon: CircleX },
  ]
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const percentOf = (value) => (total ? (value / total) * 100 : 0)

  return (
    <div className={styles.wrap}>
      <div
        className={styles.bar}
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value} (${formatPercent(percentOf(s.value))})`).join(', ')}
      >
        {total === 0 ? (
          <span className={styles.empty} />
        ) : (
          segments
            .filter((segment) => segment.value > 0)
            .map((segment, index) => (
              <span
                key={segment.key}
                className={cx(styles.segment, styles[segment.tone])}
                style={{ flexGrow: segment.value, '--i': index }}
                title={`${segment.label}: ${segment.value}`}
              />
            ))
        )}
      </div>

      <ul className={styles.legend}>
        {segments.map((segment) => {
          const Icon = segment.icon
          return (
            <li key={segment.key} className={styles.legendItem}>
              <span className={cx(styles.swatch, styles[segment.tone])} aria-hidden="true" />
              <Icon size={15} className={styles[`icon-${segment.tone}`]} aria-hidden="true" />
              <span className={styles.legendLabel}>{segment.label}</span>
              <strong className="tabular">{segment.value}</strong>
              <span className={cx(styles.legendPct, 'tabular')}>{formatPercent(percentOf(segment.value))}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
