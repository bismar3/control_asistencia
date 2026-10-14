import { useId } from 'react'
import { CircleAlert, ChevronDown } from 'lucide-react'
import styles from './Field.module.css'
import { cx } from '../../lib/cx'

/**
 * Campo de formulario con etiqueta, ícono, ayuda y error accesibles.
 * `as` puede ser 'input' | 'select' | 'textarea'.
 */
export default function Field({
  label,
  hint,
  error,
  icon: Icon,
  trailing,
  as = 'input',
  id,
  className,
  inputClassName,
  children,
  ...inputProps
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const messageId = `${inputId}-message`
  const Control = as
  const isSelect = as === 'select'

  return (
    <div className={cx(styles.field, error && styles.invalid, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={cx(styles.control, as === 'textarea' && styles.multiline)}>
        {Icon && <Icon className={styles.icon} size={18} strokeWidth={2} aria-hidden="true" />}
        <Control
          id={inputId}
          className={cx(
            styles.input,
            Icon && styles.withIcon,
            (trailing || isSelect) && styles.withTrailing,
            inputClassName,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          {...inputProps}
        >
          {children}
        </Control>
        {isSelect && !trailing && <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />}
        {trailing && <div className={styles.trailing}>{trailing}</div>}
      </div>
      {error ? (
        <p id={messageId} className={styles.error}>
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}
