import styles from './LiveDot.module.css'
import { cx } from '../../lib/cx'

/** Punto pulsante para indicar datos "en vivo". */
export default function LiveDot({ tone = 'ok', className }) {
  return <span className={cx(styles.dot, styles[tone], className)} aria-hidden="true" />
}
