import logoUrl from '../../assets/brand/coders-logo.jpg'
import markUrl from '../../assets/brand/coders-mark.jpg'
import styles from './CodersLogo.module.css'
import { cx } from '../../lib/cx'

/** Logo completo del equipo CODERS (mascota + wordmark) con halo animado. */
export function CodersLogo({ className, float = true }) {
  return (
    <div className={cx(styles.logoFrame, float && styles.float, className)}>
      <span className={styles.halo} aria-hidden="true" />
      <img src={logoUrl} alt="CODERS — equipo de desarrollo" className={styles.logo} width="960" height="826" decoding="async" />
    </div>
  )
}

/** Isotipo (mascota) en baldosa redondeada, para barras de navegación y créditos. */
export function CodersMark({ size = 40, glow = false, className }) {
  return (
    <span className={cx(styles.mark, glow && styles.glow, className)} style={{ '--size': `${size}px` }}>
      <img src={markUrl} alt="" width={size} height={size} decoding="async" />
    </span>
  )
}

/** Marca compacta: isotipo + nombre del equipo + subtítulo. */
export function CodersBrand({ subtitle = 'Control de Asistencia', size = 42, className }) {
  return (
    <span className={cx(styles.brand, className)}>
      <CodersMark size={size} glow />
      <span className={styles.brandText}>
        <span className={styles.wordmark}>
          C<span className={styles.brackets}>&lt;&gt;</span>DERS
        </span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
    </span>
  )
}

/** Crédito "Desarrollado por CODERS". */
export function CodersCredit({ className }) {
  return (
    <span className={cx(styles.credit, className)}>
      Desarrollado por
      <CodersMark size={20} />
      <strong>CODERS</strong>
    </span>
  )
}
