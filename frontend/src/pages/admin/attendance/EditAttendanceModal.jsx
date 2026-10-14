import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { Clock3, PenLine, ShieldCheck } from 'lucide-react'
import styles from './Attendance.module.css'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Field from '../../../components/ui/Field'
import Avatar from '../../../components/ui/Avatar'
import SegmentedControl from '../../../components/ui/SegmentedControl'
import StatusBadge from '../../../components/ui/StatusBadge'
import { useAuth } from '../../../context/auth-context'
import { useToast } from '../../../context/toast-context'
import { MODIFICAR_ASISTENCIA } from '../../../graphql/asistencia'
import { ATTENDANCE_REFETCH } from '../../../graphql/refetch'
import { EDITABLE_STATES, statusToEstado } from '../../../lib/attendance'
import { formatDateLong, formatTime, formatTimeRange } from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'

/**
 * Corrección administrativa de una asistencia (RF-07, RN-06, RN-07).
 * target: { student, clase, status, observacion, hora }
 */
export default function EditAttendanceModal({ target, onClose }) {
  const { adminEmail } = useAuth()
  const toast = useToast()
  const { student, clase } = target
  const [estado, setEstado] = useState(statusToEstado(target.status === 'pendiente' || target.status === 'programada' ? 'presente' : target.status))
  const [observacion, setObservacion] = useState(target.observacion ?? '')
  const [modificar, { loading }] = useMutation(MODIFICAR_ASISTENCIA)

  const handleSave = async (close) => {
    try {
      const { data } = await modificar({
        variables: {
          claseId: Number(clase.id),
          estudianteId: Number(student.id),
          nuevoEstado: estado,
          observacion: observacion.trim() || null,
          adminEmail,
        },
        refetchQueries: ATTENDANCE_REFETCH,
        awaitRefetchQueries: true,
      })
      const result = data?.modificarAsistenciaAdmin
      if (!result?.success) {
        toast.error(result?.message ?? 'No se pudo actualizar la asistencia.')
        return
      }
      const label = EDITABLE_STATES.find((option) => option.value === estado)?.label ?? estado
      toast.success(`${student.nombreCompleto} · ${clase.label}: ${label}`, { title: 'Asistencia actualizada' })
      close()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title="Modificar asistencia"
      description="El cambio quedará auditado con tu usuario, la fecha, la hora y los valores anterior y nuevo."
      icon={PenLine}
      onClose={onClose}
      dismissible={!loading}
      footer={({ close }) => (
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={() => handleSave(close)} loading={loading}>
            Guardar cambio
          </Button>
        </>
      )}
    >
      <div className={styles.editBody}>
        <div className={styles.editTarget}>
          <Avatar name={student.nombreCompleto} size={44} />
          <div className={styles.editWho}>
            <strong>{student.nombreCompleto}</strong>
            <span className="mono">{student.nroRegistro}</span>
          </div>
          <StatusBadge status={target.status} />
        </div>

        <div className={styles.editClass}>
          <span>
            <strong>{clase.label}</strong> · {formatDateLong(clase.fechaProgramada)}
          </span>
          <span className={styles.editMeta}>
            <Clock3 size={13} aria-hidden="true" /> {formatTimeRange(clase.horaInicio, clase.horaFin)}
            {target.hora && <> · Marcó a las {formatTime(target.hora)}</>}
          </span>
        </div>

        <div className={styles.editField}>
          <span className={styles.editLabel}>Nuevo estado</span>
          <SegmentedControl
            ariaLabel="Nuevo estado"
            block
            value={estado}
            onChange={setEstado}
            options={EDITABLE_STATES.map(({ value, label, icon }) => ({ value, label, icon }))}
          />
        </div>

        <Field
          as="textarea"
          label="Observación (opcional)"
          placeholder="Ej.: Presentó certificado médico, llegó al final de la clase…"
          value={observacion}
          onChange={(event) => setObservacion(event.target.value)}
          maxLength={500}
          rows={3}
        />

        <p className={styles.auditNote}>
          <ShieldCheck size={15} aria-hidden="true" /> Solo los administradores pueden modificar asistencias fuera de fecha (RN-06).
        </p>
      </div>
    </Modal>
  )
}
