import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { KeyRound, Mail, ShieldPlus, UserRound } from 'lucide-react'
import styles from './Settings.module.css'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Field from '../../../components/ui/Field'
import { useToast } from '../../../context/toast-context'
import { CREAR_ADMINISTRADOR } from '../../../graphql/admin'
import { getErrorMessage } from '../../../lib/errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Alta de un nuevo administrador con credenciales propias (RF-02). */
export default function AdminFormModal({ onClose }) {
  const toast = useToast()
  const [values, setValues] = useState({ nombreCompleto: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [crear, { loading }] = useMutation(CREAR_ADMINISTRADOR, { refetchQueries: ['Administradores'] })

  const set = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (close) => {
    const found = {}
    if (values.nombreCompleto.trim().length < 3) found.nombreCompleto = 'Ingresa el nombre completo.'
    if (!EMAIL_PATTERN.test(values.email.trim())) found.email = 'Ingresa un correo válido.'
    if (values.password.length < 8) found.password = 'Usa al menos 8 caracteres.'
    setErrors(found)
    if (Object.keys(found).length) return

    try {
      const { data } = await crear({
        variables: {
          nombreCompleto: values.nombreCompleto.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
        },
      })
      const result = data?.crearAdministrador
      if (!result?.success) {
        toast.error(result?.message ?? 'No se pudo crear el administrador.')
        return
      }
      toast.success(`${result.administrador.nombreCompleto} ya puede ingresar al panel.`, { title: 'Administrador creado' })
      close()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Modal
      title="Nuevo administrador"
      description="Tendrá acceso completo al panel de gestión."
      icon={ShieldPlus}
      onClose={onClose}
      dismissible={!loading}
      footer={({ close }) => (
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={() => handleSubmit(close)} loading={loading}>
            Crear administrador
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
          <Field label="Nombre completo" icon={UserRound} value={values.nombreCompleto} onChange={set('nombreCompleto')} error={errors.nombreCompleto} autoFocus />
          <Field label="Correo electrónico" type="email" icon={Mail} value={values.email} onChange={set('email')} error={errors.email} autoCapitalize="none" />
          <Field
            label="Contraseña inicial"
            type="password"
            icon={KeyRound}
            value={values.password}
            onChange={set('password')}
            error={errors.password}
            hint="Compártela de forma segura; podrá cambiarla desde Ajustes."
            autoComplete="new-password"
          />
          <button type="submit" hidden aria-hidden="true" />
        </form>
      )}
    </Modal>
  )
}
