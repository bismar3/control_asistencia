import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'
import { cx } from '../../lib/cx'

/**
 * Diálogo modal sobre <dialog> nativo: foco atrapado, Esc y capa superior gratis.
 * Se monta cuando se necesita y anima su salida antes de llamar a onClose.
 * `children` y `footer` pueden ser funciones que reciben { close }.
 * variant: 'dialog' (centrado / hoja inferior en móvil) | 'drawer' (panel lateral).
 */
export default function Modal({
  title,
  description,
  icon: Icon,
  tone = 'accent',
  onClose,
  children,
  footer,
  size = 'md',
  variant = 'dialog',
  dismissible = true,
  className,
}) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const [closing, setClosing] = useState(false)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // La salida se anima primero y luego se notifica al padre para desmontar.
  useEffect(() => {
    if (!closing) return undefined
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => onCloseRef.current?.(), reduceMotion ? 0 : 210)
    return () => window.clearTimeout(timer)
  }, [closing])

  const close = useCallback(() => setClosing(true), [])

  const renderSlot = (slot) => (typeof slot === 'function' ? slot({ close }) : slot)

  return (
    <dialog
      ref={dialogRef}
      className={cx(styles.dialog, styles[variant], closing && styles.closing)}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        if (dismissible) close()
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) close()
      }}
    >
      <div className={cx(styles.panel, styles[size], className)}>
        {(title || Icon) && (
          <header className={styles.header}>
            {Icon && (
              <span className={cx(styles.icon, styles[tone])} aria-hidden="true">
                <Icon size={20} strokeWidth={2.2} />
              </span>
            )}
            <div className={styles.titles}>
              {title && (
                <h2 id={titleId} className={styles.title}>
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button type="button" className={styles.close} onClick={close} aria-label="Cerrar">
                <X size={18} strokeWidth={2.4} />
              </button>
            )}
          </header>
        )}
        <div className={styles.body}>{renderSlot(children)}</div>
        {footer && <footer className={styles.footer}>{renderSlot(footer)}</footer>}
      </div>
    </dialog>
  )
}
