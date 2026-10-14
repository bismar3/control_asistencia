import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  ArrowRight,
  AtSign,
  CircleAlert,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Fingerprint,
  GraduationCap,
  Hash,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  WifiOff,
} from 'lucide-react'
import styles from './LoginPage.module.css'
import AuroraBackground from '../../components/layout/AuroraBackground'
import { CodersCredit, CodersLogo } from '../../components/brand/CodersLogo'
import SegmentedControl from '../../components/ui/SegmentedControl'
import Field from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import ThemeToggle from '../../components/ui/ThemeToggle'
import LiveDot from '../../components/ui/LiveDot'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/auth-context'
import { useToast } from '../../context/toast-context'
import { useNow } from '../../hooks/useNow'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { LOGIN_ADMIN, LOGIN_ESTUDIANTE } from '../../graphql/auth'
import { MODULO_ACTIVO } from '../../graphql/modulo'
import { formatClock, formatZonedDateLong } from '../../lib/dates'
import { getErrorMessage } from '../../lib/errors'
import { capitalize } from '../../lib/format'
import { homeFor } from '../../lib/routes'
import { cx } from '../../lib/cx'

const YEAR = new Date().getFullYear()

function LiveClock() {
  const now = useNow(1000)
  return (
    <div className={styles.clock} aria-live="off">
      <span className={cx(styles.clockTime, 'tabular')}>{formatClock(now)}</span>
      <span className={styles.clockDate}>{capitalize(formatZonedDateLong(now))}</span>
    </div>
  )
}

function ErrorMessage({ message, attempt }) {
  if (!message) return null
  return (
    <div key={attempt} className={styles.error} role="alert">
      <CircleAlert size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

function StudentForm({ onSuccess }) {
  const [identificador, setIdentificador] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [loginEstudiante, { loading }] = useMutation(LOGIN_ESTUDIANTE)

  const value = identificador.trim()
  const icon = value.includes('@') ? AtSign : /^\d/.test(value) ? Hash : UserRound

  const fail = (message) => {
    setError(message)
    setAttempt((n) => n + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!value) return fail('Ingresa tu correo electrónico o tu número de registro.')
    try {
      const { data } = await loginEstudiante({ variables: { identificador: value } })
      const result = data?.loginEstudiante
      if (!result?.success) return fail(result?.message ?? 'No se pudo iniciar sesión.')
      setError('')
      onSuccess({
        message: result.message,
        session: { rol: 'ESTUDIANTE', usuario: result.usuario, estudiante: result.estudiante },
      })
    } catch (err) {
      fail(getErrorMessage(err))
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Field
        label="Correo electrónico o Nº de registro"
        icon={icon}
        placeholder="Ej.: 1001 o juan@gmail.com"
        value={identificador}
        onChange={(event) => setIdentificador(event.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus
        hint="Usa el dato con el que fuiste inscrito en el módulo."
      />
      <ErrorMessage message={error} attempt={attempt} />
      <Button type="submit" size="lg" block loading={loading} iconRight={ArrowRight}>
        Ingresar
      </Button>
    </form>
  )
}

function AdminForm({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [loginAdmin, { loading }] = useMutation(LOGIN_ADMIN)

  const fail = (message) => {
    setError(message)
    setAttempt((n) => n + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim() || !password) return fail('Completa tu correo y tu contraseña.')
    try {
      const { data } = await loginAdmin({ variables: { email: email.trim(), password } })
      const result = data?.loginAdmin
      if (!result?.success) return fail(result?.message ?? 'Credenciales incorrectas.')
      setError('')
      onSuccess({
        message: result.message,
        session: { rol: 'ADMIN', usuario: result.usuario, administrador: result.administrador },
      })
    } catch (err) {
      fail(getErrorMessage(err))
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Field
        label="Correo electrónico"
        type="email"
        icon={Mail}
        placeholder="admin@institucion.edu"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus
      />
      <Field
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        icon={KeyRound}
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        trailing={
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />
      <ErrorMessage message={error} attempt={attempt} />
      <Button type="submit" size="lg" block loading={loading} iconRight={ArrowRight}>
        Ingresar al panel
      </Button>
    </form>
  )
}

function ModuleStatus() {
  const { data, loading, error } = useQuery(MODULO_ACTIVO, { fetchPolicy: 'network-only' })
  const modulo = data?.moduloActivo

  if (loading && !data) {
    return (
      <div className={styles.status}>
        <Spinner size={14} /> Conectando con el servidor…
      </div>
    )
  }
  if (error) {
    return (
      <div className={cx(styles.status, styles.statusBad)}>
        <WifiOff size={15} aria-hidden="true" /> Servidor no disponible. Verifica el backend.
      </div>
    )
  }
  if (!modulo) {
    return (
      <div className={cx(styles.status, styles.statusWarn)}>
        <CircleAlert size={15} aria-hidden="true" /> No hay un módulo académico activo.
      </div>
    )
  }
  return (
    <div className={cx(styles.status, styles.statusOk)}>
      <LiveDot tone="ok" />
      <span className="truncate">
        Módulo activo: <strong>{modulo.nombre}</strong>
      </span>
    </div>
  )
}

export default function LoginPage() {
  const { session, login } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const [mode, setMode] = useState('estudiante')
  useDocumentTitle('Iniciar sesión')

  if (session) {
    const home = homeFor(session.rol)
    const from = location.state?.from
    return <Navigate to={from?.startsWith(home) ? from : home} replace />
  }

  const handleSuccess = ({ message, session: nextSession }) => {
    login(nextSession)
    toast.success(message, { title: nextSession.rol === 'ADMIN' ? 'Acceso concedido' : '¡Hola de nuevo!' })
  }

  return (
    <main className={styles.page}>
      <AuroraBackground />
      <div className={styles.themeCorner}>
        <ThemeToggle />
      </div>

      <div className={styles.layout}>
        <section className={styles.hero}>
          <CodersLogo className={styles.logo} float={false} />
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>
              <Sparkles size={14} aria-hidden="true" /> Sistema web · Diplomado
            </span>
            <h1 className={styles.title}>
              Control de <span className="text-gradient">Asistencia</span>
            </h1>
            <p className={styles.lead}>
              Registra tu asistencia con un solo toque y sigue tu progreso clase a clase, en tiempo real.
            </p>
            <ul className={styles.features}>
              <li style={{ '--i': 0 }}>
                <Fingerprint size={16} aria-hidden="true" /> Marca en tu día de clase
              </li>
              <li style={{ '--i': 1 }}>
                <ShieldCheck size={16} aria-hidden="true" /> Cambios auditados
              </li>
              <li style={{ '--i': 2 }}>
                <FileSpreadsheet size={16} aria-hidden="true" /> Importación desde Excel
              </li>
            </ul>
          </div>
        </section>

        <section className={cx('glass-strong', styles.card)} aria-labelledby="login-title">
          <LiveClock />
          <div className={styles.cardHeader}>
            <h2 id="login-title" className={styles.cardTitle}>
              Iniciar sesión
            </h2>
            <p className={styles.cardSubtitle}>Elige tu perfil para continuar</p>
          </div>

          <SegmentedControl
            ariaLabel="Tipo de usuario"
            block
            value={mode}
            onChange={setMode}
            options={[
              { value: 'estudiante', label: 'Estudiante', icon: GraduationCap },
              { value: 'admin', label: 'Administrador', icon: ShieldCheck },
            ]}
          />

          <div key={mode} className={styles.formWrap}>
            {mode === 'estudiante' ? <StudentForm onSuccess={handleSuccess} /> : <AdminForm onSuccess={handleSuccess} />}
          </div>

          <ModuleStatus />
        </section>
      </div>

      <footer className={styles.footer}>
        <CodersCredit />
        <span>© {YEAR} · Sistema de Control de Asistencia</span>
      </footer>
    </main>
  )
}
