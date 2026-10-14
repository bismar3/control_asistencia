import { Link } from 'react-router'
import styles from './Button.module.css'
import { cx } from '../../lib/cx'

const ICON_SIZE = { sm: 15, md: 17, lg: 19 }

/** Enlace de navegación con la apariencia de <Button>. */
export default function LinkButton({ to, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, className, children, ...rest }) {
  const iconSize = ICON_SIZE[size]
  return (
    <Link to={to} className={cx(styles.btn, styles[variant], styles[size], className)} {...rest}>
      {Icon && <Icon size={iconSize} strokeWidth={2.2} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
      {IconRight && <IconRight size={iconSize} strokeWidth={2.2} aria-hidden="true" />}
    </Link>
  )
}
