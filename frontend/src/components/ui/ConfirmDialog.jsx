import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import Field from './Field'
import styles from './ConfirmDialog.module.css'

/**
 * Confirmación previa a acciones sensibles (RF-13).
 * `requireText`: el usuario debe escribir ese texto para habilitar la acción.
 * `onConfirm` puede ser async; si devuelve false el diálogo permanece abierto.
 */
export default function ConfirmDialog({
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'bad',
  icon = TriangleAlert,
  requireText,
  onConfirm,
  onClose,
}) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const matches = !requireText || typed.trim().toLowerCase() === requireText.trim().toLowerCase()

  return (
    <Modal
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      size="sm"
      onClose={onClose}
      dismissible={!busy}
      footer={({ close }) => (
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'bad' ? 'danger' : 'primary'}
            loading={busy}
            disabled={!matches}
            onClick={async () => {
              setBusy(true)
              try {
                const result = await onConfirm?.()
                if (result !== false) close()
              } finally {
                setBusy(false)
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <div className={styles.content}>
        {children}
        {requireText && (
          <Field
            label={
              <>
                Escribe <strong className={styles.code}>{requireText}</strong> para confirmar
              </>
            }
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoFocus
          />
        )}
      </div>
    </Modal>
  )
}
