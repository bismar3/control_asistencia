import styles from './Card.module.css'
import { cx } from '../../lib/cx'

/** Panel de vidrio con cabecera opcional (título, subtítulo, ícono y acciones). */
export default function Card({
  title,
  subtitle,
  icon: Icon,
  actions,
  padding = 'md',
  className,
  bodyClassName,
  children,
  as: Tag = 'section',
  style,
  ...rest
}) {
  const hasHeader = title || actions
  return (
    <Tag className={cx('glass', styles.card, styles[padding], className)} style={style} {...rest}>
      {hasHeader && (
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            {Icon && (
              <span className={styles.iconBox} aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
              </span>
            )}
            <div className={styles.titles}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={cx(styles.body, bodyClassName)}>{children}</div>
    </Tag>
  )
}
