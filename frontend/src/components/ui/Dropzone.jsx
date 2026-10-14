import { useId, useRef, useState } from 'react'
import { FileSpreadsheet, RefreshCw, UploadCloud, X } from 'lucide-react'
import styles from './Dropzone.module.css'
import Spinner from './Spinner'
import { cx } from '../../lib/cx'
import { EXCEL_ACCEPT } from '../../lib/files'
import { formatBytes } from '../../lib/format'

/** Zona de arrastrar y soltar para archivos Excel. */
export default function Dropzone({ file, onFile, onClear, busy = false, disabled = false, title, hint }) {
  const inputRef = useRef(null)
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  const pick = (files) => {
    const next = files?.[0]
    if (next) onFile(next)
  }

  const openPicker = () => inputRef.current?.click()

  return (
    <div
      className={cx(styles.zone, dragging && styles.dragging, file && styles.hasFile, disabled && styles.disabled)}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        if (!disabled) pick(event.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={EXCEL_ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          pick(event.target.files)
          event.target.value = ''
        }}
      />

      {file ? (
        <div className={styles.file}>
          <span className={styles.fileIcon} aria-hidden="true">
            {busy ? <Spinner size={22} /> : <FileSpreadsheet size={24} strokeWidth={2} />}
          </span>
          <div className={styles.fileInfo}>
            <strong className="truncate">{file.name}</strong>
            <span>{busy ? 'Validando con el servidor…' : formatBytes(file.size)}</span>
          </div>
          <div className={styles.fileActions}>
            <button type="button" className={styles.iconButton} onClick={openPicker} disabled={busy || disabled} aria-label="Reemplazar archivo" title="Reemplazar archivo">
              <RefreshCw size={16} />
            </button>
            {onClear && (
              <button type="button" className={styles.iconButton} onClick={onClear} disabled={busy || disabled} aria-label="Quitar archivo" title="Quitar archivo">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <label htmlFor={inputId} className={styles.empty}>
          <span className={styles.cloud} aria-hidden="true">
            <UploadCloud size={30} strokeWidth={1.8} />
          </span>
          <strong>{title ?? 'Arrastra tu archivo Excel aquí'}</strong>
          <span>
            o <span className={styles.link}>selecciónalo desde tu equipo</span>
          </span>
          <small>{hint ?? 'Formato .xlsx · máximo 5 MB'}</small>
        </label>
      )}
    </div>
  )
}
