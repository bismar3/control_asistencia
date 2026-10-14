import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { CircleCheck, CircleX, Clock3, Hash, Mail, Pencil, Phone, ShieldCheck, UserMinus } from 'lucide-react'
import styles from './Students.module.css'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Avatar from '../../../components/ui/Avatar'
import RadialMeter from '../../../components/ui/RadialMeter'
import StatusPicker from '../../../components/ui/StatusPicker'
import EmptyState from '../../../components/ui/EmptyState'
import { useAuth } from '../../../context/auth-context'
import { useToast } from '../../../context/toast-context'
import { MODIFICAR_ASISTENCIA } from '../../../graphql/asistencia'
import { ATTENDANCE_REFETCH } from '../../../graphql/refetch'
import { EDITABLE_STATES } from '../../../lib/attendance'
import { formatDateMedium, formatTimeRange } from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'
import { cx } from '../../../lib/cx'

const ESTADO_LABEL = Object.fromEntries(EDITABLE_STATES.map((option) => [option.value, option.label]))

/** Ficha lateral del estudiante: datos, resumen y su asistencia fecha por fecha (editable). */
export default function StudentDrawer({ student, classes, onClose, onEdit, onRemove }) {
  const { adminEmail } = useAuth()
  const toast = useToast()
  const [savingId, setSavingId] = useState(null)
  const [modificar] = useMutation(MODIFICAR_ASISTENCIA)

  const change = async (clase, estado) => {
    setSavingId(clase.id)
    try {
      const { data } = await modificar({
        variables: { claseId: Number(clase.id), estudianteId: Number(student.id), nuevoEstado: estado, adminEmail },
        refetchQueries: ATTENDANCE_REFETCH,
        awaitRefetchQueries: true,
      })
      const result = data?.modificarAsistenciaAdmin
      if (result?.success) toast.success(`${clase.label}: ${ESTADO_LABEL[estado]}`, { title: 'Asistencia actualizada' })
      else toast.error(result?.message ?? 'No se pudo actualizar la asistencia.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const { summary } = student

  return (
    <Modal
      variant="drawer"
      size="md"
      title="Ficha del estudiante"
      onClose={onClose}
      footer={({ close }) => (
        <>
          <Button variant="dangerGhost" icon={UserMinus} onClick={() => onRemove(student)}>
            Quitar del módulo
          </Button>
          <Button
            variant="secondary"
            icon={Pencil}
            onClick={() => {
              onEdit(student)
              close()
            }}
          >
            Editar datos
          </Button>
        </>
      )}
    >
      <div className={styles.drawer}>
        <div className={styles.drawerHead}>
          <Avatar name={student.nombreCompleto} size={64} ring />
          <div className={styles.drawerIdentity}>
            <h3>{student.nombreCompleto}</h3>
            <span className={styles.drawerMeta}>
              <Hash size={13} aria-hidden="true" /> <span className="mono">{student.nroRegistro}</span>
            </span>
            <span className={styles.drawerMeta}>
              <Mail size={13} aria-hidden="true" /> {student.email || 'Sin correo'}
            </span>
            {student.celular && (
              <span className={styles.drawerMeta}>
                <Phone size={13} aria-hidden="true" /> {student.celular}
              </span>
            )}
          </div>
        </div>

        <div className={styles.drawerStats}>
          <RadialMeter value={summary.porcentaje} size={120} stroke={11} label="Asistencia" />
          <ul className={styles.drawerTotals}>
            <li className={styles.totalOk}>
              <CircleCheck size={16} aria-hidden="true" /> <strong className="tabular">{summary.presente}</strong> Presentes
            </li>
            <li className={styles.totalBad}>
              <CircleX size={16} aria-hidden="true" /> <strong className="tabular">{summary.falta}</strong> Faltas
            </li>
            <li className={styles.totalWarn}>
              <ShieldCheck size={16} aria-hidden="true" /> <strong className="tabular">{summary.justificado}</strong> Justificadas
            </li>
          </ul>
        </div>

        <h4 className={styles.drawerSection}>Asistencia por fecha</h4>
        {classes.length === 0 ? (
          <EmptyState compact icon={Clock3} tone="neutral" title="Sin fechas de clase" />
        ) : (
          <ul className={styles.timeline}>
            {classes.map((clase, index) => {
              const cell = student.cells[index]
              return (
                <li key={clase.id} className={cx(styles.timelineItem, styles[`dot-${cell.status}`])}>
                  <div className={styles.timelineText}>
                    <strong>
                      {clase.label} · {formatDateMedium(clase.fechaProgramada)}
                    </strong>
                    <span>
                      {formatTimeRange(clase.horaInicio, clase.horaFin)}
                      {cell.status === 'presente' && cell.hora && <> · marcó {cell.hora.slice(0, 5)}</>}
                    </span>
                  </div>
                  <StatusPicker
                    status={cell.status}
                    busy={savingId === clase.id}
                    disabled={savingId != null && savingId !== clase.id}
                    label={`Estado en ${clase.label}`}
                    onChange={(estado) => change(clase, estado)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
