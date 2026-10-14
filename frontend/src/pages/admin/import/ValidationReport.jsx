import { CircleAlert, CircleCheck, Eye, TriangleAlert } from 'lucide-react'
import styles from './Import.module.css'
import { formatDateMedium, formatTime } from '../../../lib/dates'
import { capitalize } from '../../../lib/format'
import { cx } from '../../../lib/cx'

function StudentsPreview({ rows }) {
  return (
    <table className={styles.previewTable}>
      <thead>
        <tr>
          <th scope="col">Fila</th>
          <th scope="col">Nº registro</th>
          <th scope="col">Nombre completo</th>
          <th scope="col">Correo electrónico</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.fila}-${row.nro_registro}`}>
            <td className={styles.rowNumber}>{row.fila}</td>
            <td className="mono">{row.nro_registro}</td>
            <td>{row.nombre_completo}</td>
            <td className={styles.mutedCell}>{row.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DatesPreview({ rows }) {
  return (
    <table className={styles.previewTable}>
      <thead>
        <tr>
          <th scope="col">Fila</th>
          <th scope="col">Fecha</th>
          <th scope="col">Hora inicio</th>
          <th scope="col">Hora fin</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.fila}-${row.fecha}`}>
            <td className={styles.rowNumber}>{row.fila}</td>
            <td>{capitalize(formatDateMedium(row.fecha))}</td>
            <td className="tabular">{formatTime(row.hora_inicio) || '—'}</td>
            <td className="tabular">{formatTime(row.hora_fin) || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Resultado de la validación: estado general, errores por fila (RF-11) y vista previa (RF-16). */
export default function ValidationReport({ kind, validation }) {
  const { result, error, validating } = validation
  if (validating) return null

  if (error) {
    return (
      <div className={cx(styles.banner, styles.bannerBad)} role="alert">
        <CircleAlert size={18} aria-hidden="true" />
        <span>{error}</span>
      </div>
    )
  }
  if (!result) return null

  const noun = kind === 'estudiantes' ? ['estudiante', 'estudiantes'] : ['fecha de clase', 'fechas de clase']
  const preview = Array.isArray(result.preview) ? result.preview : []

  return (
    <div className={styles.report}>
      {result.valido ? (
        <div className={cx(styles.banner, styles.bannerOk)}>
          <CircleCheck size={18} aria-hidden="true" />
          <span>
            Archivo válido: <strong>{result.totalValidos}</strong> {result.totalValidos === 1 ? noun[0] : noun[1]} listos para importar.
          </span>
        </div>
      ) : result.totalErrores > 0 ? (
        <div className={cx(styles.banner, styles.bannerBad)} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <span>
            Se encontraron <strong>{result.totalErrores}</strong> {result.totalErrores === 1 ? 'error' : 'errores'} en{' '}
            {result.totalFilas} filas. Corrígelos en el Excel y vuelve a subirlo.
          </span>
        </div>
      ) : (
        <div className={cx(styles.banner, styles.bannerWarn)} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <span>El archivo no contiene filas con datos. Revisa que la primera fila sea el encabezado.</span>
        </div>
      )}

      {result.errores?.length > 0 && (
        <div className={styles.errorsBox}>
          <h4 className={styles.reportTitle}>Filas que deben corregirse</h4>
          <ul className={styles.errorList}>
            {result.errores.map((item) => (
              <li key={`${item.fila}-${item.error}`}>
                <span className={styles.errorRow}>Fila {item.fila}</span>
                <span className={styles.errorText}>
                  {item.error}
                  {item.datos && <small>{item.datos}</small>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview.length > 0 && (
        <div className={styles.previewBox}>
          <h4 className={styles.reportTitle}>
            <Eye size={14} aria-hidden="true" /> Vista previa
            <span className={styles.previewCount}>
              {preview.length < result.totalValidos ? `primeras ${preview.length} de ${result.totalValidos}` : `${preview.length} filas`}
            </span>
          </h4>
          <div className={styles.previewScroll}>
            {kind === 'estudiantes' ? <StudentsPreview rows={preview} /> : <DatesPreview rows={preview} />}
          </div>
        </div>
      )}
    </div>
  )
}
