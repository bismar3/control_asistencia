import styles from './PageHeader.module.css'

/** Encabezado de página: título grande estilo iOS, descripción y acciones. */
export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
