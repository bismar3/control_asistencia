import { useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { Hash, Mail, Phone, UserPlus, UserRound, UserRoundPen } from 'lucide-react'
import styles from './Students.module.css'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Field from '../../../components/ui/Field'
import { useToast } from '../../../context/toast-context'
import {
  CREAR_ESTUDIANTE,
  EDITAR_ESTUDIANTE,
  ESTUDIANTE_POR_REGISTRO,
  INSCRIBIR_ESTUDIANTE,
} from '../../../graphql/estudiantes'
import { STUDENTS_REFETCH } from '../../../graphql/refetch'
import { getErrorMessage } from '../../../lib/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function friendlyError(error) {
  const message = getErrorMessage(error)
  if (/unique|duplicate|duplicad/i.test(message)) return 'El correo o el número de registro ya pertenece a otro estudiante.'
  return message
}

function validate(values) {
  const errors = {}
  if (!values.nroRegistro.trim()) errors.nroRegistro = 'El número de registro es obligatorio.'
  if (!values.nombre.trim()) errors.nombre = 'El nombre es obligatorio.'
  if (!values.email.trim()) errors.email = 'El correo es obligatorio.'
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Ingresa un correo válido.'
  return errors
}

/** Alta manual de un estudiante en el módulo activo, o edición de sus datos. */
export default function StudentFormModal({ student, moduloId, onClose }) {
  const editing = Boolean(student)
  const toast = useToast()
  const client = useApolloClient()
  const [values, setValues] = useState(() => ({
    nroRegistro: student?.nroRegistro ?? '',
    nombre: student?.nombre ?? '',
    apellidoPaterno: student?.apellidoPaterno ?? '',
    apellidoMaterno: student?.apellidoMaterno ?? '',
    email: student?.email ?? '',
    celular: student?.celular ?? '',
  }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [crear] = useMutation(CREAR_ESTUDIANTE)
  const [editar] = useMutation(EDITAR_ESTUDIANTE)
  const [inscribir] = useMutation(INSCRIBIR_ESTUDIANTE)

  const set = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const payload = () => ({
    nroRegistro: values.nroRegistro.trim(),
    nombre: values.nombre.trim(),
    apellidoPaterno: values.apellidoPaterno.trim(),
    apellidoMaterno: values.apellidoMaterno.trim(),
    email: values.email.trim().toLowerCase(),
    celular: values.celular.trim(),
  })

  const enroll = async (estudianteId) => {
    const { data } = await inscribir({ variables: { moduloId: Number(moduloId), estudianteId: Number(estudianteId) } })
    if (!data?.inscribirEstudiante?.success) throw new Error(data?.inscribirEstudiante?.message ?? 'No se pudo inscribir al estudiante.')
  }

  const handleSubmit = async (close) => {
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    try {
      if (editing) {
        const { data } = await editar({ variables: { id: Number(student.id), ...payload() }, refetchQueries: STUDENTS_REFETCH })
        const result = data?.editarEstudiante
        if (!result?.success) {
          toast.error(result?.message ?? 'No se pudieron guardar los cambios.')
          return
        }
        toast.success(result.message, { title: 'Estudiante actualizado' })
        close()
        return
      }

      const { data } = await crear({ variables: payload() })
      const result = data?.crearEstudiante
      if (result?.success) {
        await enroll(result.estudiante.id)
        await client.refetchQueries({ include: STUDENTS_REFETCH })
        toast.success(`${result.estudiante.nombreCompleto} fue inscrito en el módulo activo.`, { title: 'Estudiante agregado' })
        close()
        return
      }

      // El registro ya existe (por ejemplo, de un módulo anterior): se reutiliza y se inscribe.
      if (/ya se encuentra registrado/i.test(result?.message ?? '')) {
        const { data: existing } = await client.query({
          query: ESTUDIANTE_POR_REGISTRO,
          variables: { nroRegistro: payload().nroRegistro },
          fetchPolicy: 'network-only',
        })
        if (existing?.estudiante) {
          await enroll(existing.estudiante.id)
          await client.refetchQueries({ include: STUDENTS_REFETCH })
          toast.info(`${existing.estudiante.nombreCompleto} ya existía en el sistema y fue inscrito en el módulo activo.`, {
            title: 'Estudiante reincorporado',
          })
          close()
          return
        }
      }
      toast.error(result?.message ?? 'No se pudo registrar al estudiante.')
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Editar estudiante' : 'Agregar estudiante'}
      description={editing ? 'Actualiza los datos personales del estudiante.' : 'Se registrará y se inscribirá en el módulo activo.'}
      icon={editing ? UserRoundPen : UserPlus}
      onClose={onClose}
      dismissible={!saving}
      size="md"
      footer={({ close }) => (
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => handleSubmit(close)} loading={saving} icon={editing ? undefined : UserPlus}>
            {editing ? 'Guardar cambios' : 'Agregar al módulo'}
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
          <Field
            label="Número de registro *"
            icon={Hash}
            value={values.nroRegistro}
            onChange={set('nroRegistro')}
            error={errors.nroRegistro}
            placeholder="Ej.: 1001"
            autoFocus
            inputClassName="mono"
          />
          <Field label="Nombres *" icon={UserRound} value={values.nombre} onChange={set('nombre')} error={errors.nombre} placeholder="Ej.: Juan Carlos" />
          <div className={styles.formRow}>
            <Field label="Apellido paterno" value={values.apellidoPaterno} onChange={set('apellidoPaterno')} placeholder="Ej.: Pérez" />
            <Field label="Apellido materno" value={values.apellidoMaterno} onChange={set('apellidoMaterno')} placeholder="Ej.: Rojas" />
          </div>
          <Field
            label="Correo electrónico *"
            type="email"
            icon={Mail}
            value={values.email}
            onChange={set('email')}
            error={errors.email}
            placeholder="estudiante@correo.com"
            autoCapitalize="none"
          />
          <Field label="Celular" type="tel" icon={Phone} value={values.celular} onChange={set('celular')} placeholder="Ej.: 70012345" />
          <button type="submit" hidden aria-hidden="true" />
        </form>
      )}
    </Modal>
  )
}
