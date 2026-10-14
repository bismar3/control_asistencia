import { CodersMark } from '../brand/CodersLogo'
import styles from './FullScreenLoader.module.css'

/** Pantalla de carga inicial (mientras llega el primer fragmento de la ruta). */
export default function FullScreenLoader() {
  return (
    <div className={styles.loader} role="status" aria-label="Cargando">
      <div className={styles.mark}>
        <span className={styles.ring} aria-hidden="true" />
        <CodersMark size={76} glow />
      </div>
      <p className={styles.text}>
        Cargando<span className={styles.caret}>_</span>
      </p>
    </div>
  )
}
