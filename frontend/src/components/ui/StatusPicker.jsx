import styles from './StatusPicker.module.css'
import Spinner from './Spinner'
import { EDITABLE_STATES, statusToEstado } from '../../lib/attendance'
import { cx } from '../../lib/cx'

/**
 * Selector compacto Presente / Falta / Justificado para una celda de asistencia.
 * Los estados "Sin marcar" y "Programada" no seleccionan ninguna opción.
 */
export default function StatusPicker({ status, onChange, busy = false, disabled = false, label = 'Estado de asistencia' }) {
  const current = status === 'pendiente' || status === 'programada' ? null : statusToEstado(status)
  return (
    <div className={cx(styles.picker, busy && styles.busy)} role="radiogroup" aria-label={label}>
      {EDITABLE_STATES.map((option) => {
        const Icon = option.icon
        const selected = current === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            disabled={disabled || busy}
            className={cx(styles.option, styles[option.tone], selected && styles.selected)}
            onClick={() => !selected && onChange(option.value)}
          >
            <Icon size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )
      })}
      {busy && (
        <span className={styles.spinner} aria-hidden="true">
          <Spinner size={14} />
        </span>
      )}
    </div>
  )
}
