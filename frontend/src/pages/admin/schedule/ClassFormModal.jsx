import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { CalendarCog, CalendarPlus, Clock3, Type } from 'lucide-react'
import styles from './Schedule.module.css'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Field from '../../../components/ui/Field'
import { useToast } from '../../../context/toast-context'
import { CREAR_CLASE, EDITAR_CLASE } from '../../../graphql/modulo'
import { SCHEDULE_REFETCH } from '../../../graphql/refetch'
import { formatDateLong, formatTime } from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'

/** Programa una fecha de clase manualmente o edita una existente (complementa RF-12). */
export default function ClassFormModal({ clase, defaultDate, moduloId, classes, onClose }) {
  const editing = Boolean(clase)
  const toast = useToast()
  const [values, setValues] = useState(() => ({
    fecha: clase?.fechaProgramada ?? defaultDate ?? '',
    horaInicio: formatTime(clase?.horaInicio) || '18:00',
    horaFin: formatTime(clase?.horaFin) || '21:00',
    nombre: clase && !/^clase\s+\d+$/i.test(clase.nombre ?? '') ? (clase.nombre ?? '') : '',
  }))
  const [errors, setErrors] = useState({})
  const [crear, { loading: creating }] = useMutation(CREAR_CLASE)
  const [editar, { loading: updating }] = useMutation(EDITAR_CLASE)
  const saving = creating || updating

  const set = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const found = {}
    if (!values.fecha) found.fecha = 'Selecciona la fecha de la clase.'
    else if (classes.some((item) => item.fechaProgramada === values.fecha && item.id !== clase?.id)) {
      found.fecha = 'Ya existe una clase programada en esa fecha.'
    }
    if (values.horaInicio && values.horaFin && values.horaFin <= values.horaInicio) {
      found.horaFin = 'La hora de fin debe ser posterior a la de inicio.'
    }
    return found
  }

  const handleSubmit = async (close) => {
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    const common = {
      fechaProgramada: values.fecha,
      horaInicio: values.horaInicio || null,
      horaFin: values.horaFin || null,
      nombre: values.nombre.trim(),
    }

    try {
      if (editing) {
        const { data } = await editar({ variables: { id: Number(clase.id), ...common }, refetchQueries: SCHEDULE_REFETCH })
        const result = data?.editarClase
        if (!result?.success) return toast.error(result?.message ?? 'No se pudo actualizar la clase.')
        toast.success(`La clase quedó programada para el ${formatDateLong(values.fecha)}.`, { title: 'Clase actualizada' })
      } else {
        const orden = classes.filter((item) => item.fechaProgramada < values.fecha).length + 1
        const { data } = await crear({
          variables: { moduloId: Number(moduloId), orden, ...common },
          refetchQueries: SCHEDULE_REFETCH,
        })
        const result = data?.crearClase
        if (!result?.success) return toast.error(result?.message ?? 'No se pudo programar la clase.')
        toast.success(`Nueva clase el ${formatDateLong(values.fecha)}.`, { title: 'Clase programada' })
      }
      close()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title={editing ? 'Editar clase' : 'Programar clase'}
      description="La fecha habilita el registro de asistencia durante todo el día. El horario es informativo."
      icon={editing ? CalendarCog : CalendarPlus}
      onClose={onClose}
      dismissible={!saving}
      footer={({ close }) => (
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => handleSubmit(close)} loading={saving}>
            {editing ? 'Guardar cambios' : 'Programar clase'}
          </Button>
        </>
      )}
    >
      {({ close }) => (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit(close)
          }}
          noValidate
        >
          <Field label="Fecha de la clase *" type="date" value={values.fecha} onChange={set('fecha')} error={errors.fecha} autoFocus />
          <div className={styles.formRow}>
            <Field label="Hora de inicio" type="time" icon={Clock3} value={values.horaInicio} onChange={set('horaInicio')} />
            <Field label="Hora de fin" type="time" icon={Clock3} value={values.horaFin} onChange={set('horaFin')} error={errors.horaFin} />
          </div>
          <Field
            label="Tema o título (opcional)"
            icon={Type}
            value={values.nombre}
            onChange={set('nombre')}
            placeholder="Ej.: Introducción a GraphQL"
            hint="Si lo dejas vacío se mostrará como «Clase N» según el orden cronológico."
            maxLength={200}
          />
          <button type="submit" hidden aria-hidden="true" />
        </form>
      )}
    </Modal>
  )
}
