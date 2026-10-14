import { CalendarClock, UsersRound } from 'lucide-react'
import styles from './Attendance.module.css'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'
import EmptyState from '../../../components/ui/EmptyState'
import { STATUS, severityOf } from '../../../lib/attendance'
import { formatDateLong, formatMonthShort, parseISODate } from '../../../lib/dates'
import { formatPercent, normalizeText } from '../../../lib/format'
import { cx } from '../../../lib/cx'

const LEGEND = ['presente', 'falta', 'justificado', 'pendiente', 'programada']

/** Vista general: matriz estudiantes × fechas con totales por fecha y por estudiante (RF-08). */
export default function MatrixView({ model, search, onEdit }) {
  const term = normalizeText(search)
  const students = model.students.filter(
    (student) => !term || normalizeText(`${student.nombreCompleto} ${student.nroRegistro} ${student.email}`).includes(term),
  )

  if (model.classes.length === 0) {
    return (
      <Card>
        <EmptyState icon={CalendarClock} tone="neutral" title="No hay fechas de clase" description="Importa el calendario del módulo para ver la matriz." />
      </Card>
    )
  }

  return (
    <Card padding="none" className="anim-fade-up" style={{ '--i': 1 }}>
      <div className={styles.matrixLegend}>
        {LEGEND.map((key) => {
          const meta = STATUS[key]
          const Icon = meta.icon
          return (
            <span key={key} className={cx(styles.legendChip, styles[`cell-${key}`])}>
              <Icon size={14} strokeWidth={2.4} aria-hidden="true" /> {meta.label}
            </span>
          )
        })}
        <span className={styles.matrixHint}>Toca una celda para modificar la asistencia.</span>
      </div>

      {students.length === 0 ? (
        <EmptyState icon={UsersRound} tone="neutral" title="Ningún estudiante coincide" description="Cambia el término de búsqueda." />
      ) : (
        <div className={styles.matrixWrap}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th scope="col" className={styles.stickyCol}>
                  Estudiante
                </th>
                {model.classes.map((clase) => (
                  <th
                    key={clase.id}
                    scope="col"
                    className={cx(styles.dateHead, styles[`timing-${clase.timing}`])}
                    title={`${clase.label} · ${formatDateLong(clase.fechaProgramada)}`}
                  >
                    <span className={styles.dhDay}>{parseISODate(clase.fechaProgramada).getDate()}</span>
                    <span className={styles.dhMonth}>{formatMonthShort(clase.fechaProgramada)}</span>
                  </th>
                ))}
                <th scope="col" className={styles.totalHead} title="Presentes">
                  P
                </th>
                <th scope="col" className={styles.totalHead} title="Faltas">
                  F
                </th>
                <th scope="col" className={styles.totalHead} title="Justificados">
                  J
                </th>
                <th scope="col" className={styles.totalHead}>
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const severity = severityOf(student.summary.porcentaje)
                return (
                  <tr key={student.id}>
                    <th scope="row" className={styles.stickyCol}>
                      <span className={styles.matrixStudent}>
                        <Avatar name={student.nombreCompleto} size={30} />
                        <span className={styles.studentText}>
                          <strong className="truncate">{student.nombreCompleto}</strong>
                          <span className="mono">{student.nroRegistro}</span>
                        </span>
                      </span>
                    </th>
                    {student.cells.map((cell, index) => {
                      const clase = model.classes[index]
                      const meta = STATUS[cell.status]
                      const Icon = meta.icon
                      return (
                        <td key={cell.claseId} className={styles.cellTd}>
                          <button
                            type="button"
                            className={cx(styles.cell, styles[`cell-${cell.status}`])}
                            onClick={() =>
                              onEdit({
                                student,
                                clase,
                                status: cell.status,
                                observacion: '',
                                hora: cell.status === 'presente' ? cell.hora : null,
                              })
                            }
                            aria-label={`${student.nombreCompleto}, ${formatDateLong(clase.fechaProgramada)}: ${meta.label}`}
                            title={`${meta.label}${cell.status === 'presente' && cell.hora ? ` · ${cell.hora.slice(0, 5)}` : ''}`}
                          >
                            {cell.status === 'programada' ? (
                              <span className={styles.futureDot} aria-hidden="true" />
                            ) : (
                              <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
                            )}
                          </button>
                        </td>
                      )
                    })}
                    <td className={cx(styles.totalCell, 'tabular')}>{student.summary.presente}</td>
                    <td className={cx(styles.totalCell, 'tabular')}>{student.summary.falta}</td>
                    <td className={cx(styles.totalCell, 'tabular')}>{student.summary.justificado}</td>
                    <td className={styles.totalCell}>
                      <span className={cx(styles.pctChip, styles[`tone-${severity}`], 'tabular')}>
                        {formatPercent(student.summary.porcentaje)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className={styles.stickyCol}>
                  Presentes por fecha
                </th>
                {model.classes.map((clase) => (
                  <td key={clase.id} className={cx(styles.footCell, 'tabular')}>
                    {clase.timing === 'futura' ? '—' : clase.summary.presente}
                  </td>
                ))}
                <td colSpan={4} className={cx(styles.footCell, 'tabular')}>
                  {model.overall.presente}
                </td>
              </tr>
              <tr>
                <th scope="row" className={styles.stickyCol}>
                  Ausentes por fecha
                </th>
                {model.classes.map((clase) => (
                  <td key={clase.id} className={cx(styles.footCell, 'tabular')}>
                    {clase.timing === 'futura' ? '—' : clase.summary.falta + clase.summary.justificado}
                  </td>
                ))}
                <td colSpan={4} className={cx(styles.footCell, 'tabular')}>
                  {model.overall.falta + model.overall.justificado}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  )
}
