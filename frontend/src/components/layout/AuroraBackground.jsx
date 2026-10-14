import styles from './AuroraBackground.module.css'

/** Fondo fijo con manchas de luz que se desplazan lentamente y una retícula de puntos. */
export default function AuroraBackground() {
  return (
    <div className={styles.aurora} aria-hidden="true">
      <span className={`${styles.blob} ${styles.a}`} />
      <span className={`${styles.blob} ${styles.b}`} />
      <span className={`${styles.blob} ${styles.c}`} />
      <span className={`${styles.blob} ${styles.d}`} />
      <span className={styles.dots} />
      <span className={styles.vignette} />
    </div>
  )
}
