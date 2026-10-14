import styles from './Button.module.css'
import Spinner from './Spinner'
import { cx } from '../../lib/cx'

const ICON_SIZE = { sm: 15, md: 17, lg: 19 }

/**
 * Botón del sistema de diseño.
 * variant: primary | secondary | ghost | soft | danger | success
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  block = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}) {
  const iconSize = ICON_SIZE[size]
  return (
    <button
      type={type}
      className={cx(styles.btn, styles[variant], styles[size], block && styles.block, !children && styles.iconOnly, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={iconSize} /> : Icon && <Icon size={iconSize} strokeWidth={2.2} aria-hidden="true" />}
      {children && <span className={styles.label}>{children}</span>}
      {IconRight && !loading && <IconRight size={iconSize} strokeWidth={2.2} aria-hidden="true" />}
    </button>
  )
}
