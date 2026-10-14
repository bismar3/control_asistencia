import { useId } from 'react'
import styles from './Switch.module.css'
import { cx } from '../../lib/cx'

/** Interruptor estilo iOS basado en un checkbox nativo (accesible y con teclado). */
export default function Switch({ checked, onChange, label, description, className }) {
  const id = useId()
  return (
    <label htmlFor={id} className={cx(styles.wrap, className)}>
      <input id={id} type="checkbox" role="switch" className={styles.input} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      {(label || description) && (
        <span className={styles.text}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </span>
      )}
    </label>
  )
}
