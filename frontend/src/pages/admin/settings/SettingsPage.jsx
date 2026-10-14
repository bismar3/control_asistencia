import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  BadgeCheck,
  Code,
  Database,
  KeyRound,
  LockKeyhole,
  Mail,
  Palette,
  Save,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import styles from './Settings.module.css'
import AdminFormModal from './AdminFormModal'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Field from '../../../components/ui/Field'
import Avatar from '../../../components/ui/Avatar'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonRows } from '../../../components/ui/Skeleton'
import { Tag } from '../../../components/ui/StatusBadge'
import { ThemeSelector } from '../../../components/ui/ThemeToggle'
import { CodersLogo } from '../../../components/brand/CodersLogo'
import { useAuth } from '../../../context/auth-context'
import { useToast } from '../../../context/toast-context'
import { CAMBIAR_PASSWORD } from '../../../graphql/auth'
import { ADMINISTRADORES, EDITAR_ADMINISTRADOR, ELIMINAR_ADMINISTRADOR } from '../../../graphql/admin'
import { APP_VERSION } from '../../../config'
import { formatDate, zonedDateOf } from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'
import { cx } from '../../../lib/cx'

function passwordStrength(password) {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return Math.min(score, 4)
}

const STRENGTH = [
  { label: 'Muy débil', tone: 'bad' },
  { label: 'Débil', tone: 'bad' },
  { label: 'Aceptable', tone: 'warn' },
  { label: 'Buena', tone: 'ok' },
  { label: 'Excelente', tone: 'ok' },
]

function ProfileCard() {
  const { session, login } = useAuth()
  const toast = useToast()
  const admin = session?.administrador
  const [nombre, setNombre] = useState(admin?.nombreCompleto ?? '')
  const [email, setEmail] = useState(session?.usuario?.email ?? '')
  const [editar, { loading }] = useMutation(EDITAR_ADMINISTRADOR, { refetchQueries: ['Administradores'] })
  const dirty = nombre.trim() !== (admin?.nombreCompleto ?? '') || email.trim().toLowerCase() !== (session?.usuario?.email ?? '')

  const handleSave = async (event) => {
    event.preventDefault()
    try {
      const { data } = await editar({ variables: { id: Number(admin.id), nombreCompleto: nombre.trim(), email: email.trim() } })
      const result = data?.editarAdministrador
      if (!result?.success) {
        toast.error(result?.message ?? 'No se pudo actualizar el perfil.')
        return
      }
      login({
        ...session,
        administrador: result.administrador,
        usuario: { ...session.usuario, email: result.administrador.email },
      })
      toast.success('Tus datos se actualizaron correctamente.', { title: 'Perfil actualizado' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Card title="Mi perfil" subtitle="Datos de tu cuenta de administrador" icon={UserRound} className="anim-fade-up">
      <div className={styles.profileHead}>
        <Avatar name={admin?.nombreCompleto || session?.usuario?.email} size={64} ring />
        <div className={styles.profileText}>
          <strong>{admin?.nombreCompleto || 'Administrador'}</strong>
          <span>{session?.usuario?.email}</span>
          <Tag tone="accent" icon={BadgeCheck} size="sm">
            Administrador
          </Tag>
        </div>
      </div>

      {admin ? (
        <form className={styles.form} onSubmit={handleSave}>
          <Field label="Nombre completo" icon={UserRound} value={nombre} onChange={(event) => setNombre(event.target.value)} />
          <Field label="Correo electrónico" type="email" icon={Mail} value={email} onChange={(event) => setEmail(event.target.value)} />
          <div className={styles.formActions}>
            <Button type="submit" icon={Save} loading={loading} disabled={!dirty || nombre.trim().length < 3}>
              Guardar cambios
            </Button>
          </div>
        </form>
      ) : (
        <p className={styles.note}>
          Esta cuenta no tiene un perfil de administrador asociado (fue creada desde el panel de Django), por lo que sus datos se editan
          desde allí.
        </p>
      )}
    </Card>
  )
}

function SecurityCard() {
  const { session } = useAuth()
  const toast = useToast()
  const [values, setValues] = useState({ actual: '', nueva: '', confirmar: '' })
  const [errors, setErrors] = useState({})
  const [cambiar, { loading }] = useMutation(CAMBIAR_PASSWORD)
  const strength = passwordStrength(values.nueva)

  const set = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {}
    if (!values.actual) found.actual = 'Ingresa tu contraseña actual.'
    if (values.nueva.length < 8) found.nueva = 'La nueva contraseña debe tener al menos 8 caracteres.'
    if (values.nueva !== values.confirmar) found.confirmar = 'Las contraseñas no coinciden.'
    setErrors(found)
    if (Object.keys(found).length) return

    try {
      const { data } = await cambiar({
        variables: { email: session.usuario.email, passwordActual: values.actual, passwordNuevo: values.nueva },
      })
      const result = data?.cambiarPassword
      if (!result?.success) {
        setErrors({ actual: result?.message ?? 'No se pudo cambiar la contraseña.' })
        return
      }
      setValues({ actual: '', nueva: '', confirmar: '' })
      toast.success(result.message, { title: 'Contraseña actualizada' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Card title="Seguridad" subtitle="Cambia tu contraseña de acceso" icon={LockKeyhole} className="anim-fade-up" style={{ '--i': 1 }}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          label="Contraseña actual"
          type="password"
          icon={KeyRound}
          value={values.actual}
          onChange={set('actual')}
          error={errors.actual}
          autoComplete="current-password"
        />
        <Field
          label="Nueva contraseña"
          type="password"
          icon={KeyRound}
          value={values.nueva}
          onChange={set('nueva')}
          error={errors.nueva}
          autoComplete="new-password"
        />
        {values.nueva && (
          <div className={styles.strength} aria-live="polite">
            <div className={styles.strengthBars}>
              {[0, 1, 2, 3].map((index) => (
                <span key={index} className={cx(index < strength && styles[`bar-${STRENGTH[strength].tone}`])} />
              ))}
            </div>
            <span className={styles[`text-${STRENGTH[strength].tone}`]}>{STRENGTH[strength].label}</span>
          </div>
        )}
        <Field
          label="Confirmar nueva contraseña"
          type="password"
          icon={KeyRound}
          value={values.confirmar}
          onChange={set('confirmar')}
          error={errors.confirmar}
          autoComplete="new-password"
        />
        <div className={styles.formActions}>
          <Button type="submit" icon={ShieldCheck} loading={loading}>
            Actualizar contraseña
          </Button>
        </div>
      </form>
    </Card>
  )
}

function AdminsCard() {
  const { session } = useAuth()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState(null)
  const { data, loading } = useQuery(ADMINISTRADORES)
  const [eliminar] = useMutation(ELIMINAR_ADMINISTRADOR, { refetchQueries: ['Administradores'], awaitRefetchQueries: true })
  const admins = data?.administradores ?? []
  const myEmail = session?.usuario?.email

  const handleRemove = async () => {
    try {
      const { data: response } = await eliminar({ variables: { id: Number(removing.id) } })
      const result = response?.eliminarAdministrador
      if (!result?.success) {
        toast.error(result?.message ?? 'No se pudo eliminar al administrador.')
        return false
      }
      toast.success(result.message, { title: 'Administrador eliminado' })
      return true
    } catch (err) {
      toast.error(getErrorMessage(err))
      return false
    }
  }

  return (
    <Card
      title="Administradores"
      subtitle="Personas con acceso al panel de gestión"
      icon={UsersRound}
      className="anim-fade-up"
      style={{ '--i': 2 }}
      actions={
        <Button size="sm" variant="soft" icon={ShieldPlus} onClick={() => setCreating(true)}>
          Nuevo
        </Button>
      }
    >
      {loading && !data ? (
        <SkeletonRows rows={2} height={56} />
      ) : admins.length === 0 ? (
        <EmptyState compact icon={UsersRound} tone="neutral" title="Sin perfiles de administrador" />
      ) : (
        <ul className={styles.adminList}>
          {admins.map((admin) => {
            const isMe = admin.email === myEmail
            return (
              <li key={admin.id} className={styles.adminItem}>
                <Avatar name={admin.nombreCompleto} size={38} />
                <span className={styles.adminText}>
                  <strong className="truncate">
                    {admin.nombreCompleto} {isMe && <Tag tone="ok" size="sm">Tú</Tag>}
                  </strong>
                  <span className="truncate">
                    {admin.email} · desde {formatDate(zonedDateOf(admin.createdAt))}
                  </span>
                </span>
                {!isMe && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => setRemoving(admin)}
                    aria-label={`Eliminar a ${admin.nombreCompleto}`}
                    title="Eliminar administrador"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {creating && <AdminFormModal onClose={() => setCreating(false)} />}
      {removing && (
        <ConfirmDialog
          title="Eliminar administrador"
          description={removing.nombreCompleto}
          icon={Trash2}
          confirmLabel="Eliminar"
          onConfirm={handleRemove}
          onClose={() => setRemoving(null)}
        >
          <p>{removing.email} perderá el acceso al panel de inmediato.</p>
        </ConfirmDialog>
      )}
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Cuenta y sistema" title="Ajustes" description="Administra tu perfil, la seguridad de tu cuenta y la apariencia de la aplicación." />

      <div className={styles.grid}>
        <div className={styles.column}>
          <ProfileCard />
          <SecurityCard />
        </div>
        <div className={styles.column}>
          <Card title="Apariencia" subtitle="Tema claro, oscuro o según tu sistema" icon={Palette} className="anim-fade-up" style={{ '--i': 1 }}>
            <ThemeSelector block />
          </Card>
          <AdminsCard />
          <Card className="anim-fade-up" bodyClassName={styles.about} style={{ '--i': 3 }}>
            <CodersLogo className={styles.aboutLogo} />
            <div className={styles.aboutText}>
              <h3>Sistema de Control de Asistencia</h3>
              <p>
                Versión {APP_VERSION} · Desarrollado por el equipo <strong>CODERS</strong>.
              </p>
              <ul className={styles.stack}>
                <li>
                  <Code size={14} aria-hidden="true" /> React + Vite
                </li>
                <li>
                  <Code size={14} aria-hidden="true" /> Apollo Client · GraphQL
                </li>
                <li>
                  <Database size={14} aria-hidden="true" /> Django · PostgreSQL
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
