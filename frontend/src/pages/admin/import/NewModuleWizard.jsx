import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useApolloClient, useMutation } from '@apollo/client/react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleX,
  FileSpreadsheet,
  Layers,
  PartyPopper,
  RefreshCw,
  Rocket,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import styles from './Import.module.css'
import ExcelStep from './ExcelStep'
import { useExcelValidation } from './useExcelValidation'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Field from '../../../components/ui/Field'
import Switch from '../../../components/ui/Switch'
import Spinner from '../../../components/ui/Spinner'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useAuth } from '../../../context/auth-context'
import { ACTIVAR_MODULO, CREAR_MODULO, ELIMINAR_MODULO } from '../../../graphql/modulo'
import { IMPORTAR_ESTUDIANTES, IMPORTAR_FECHAS } from '../../../graphql/importacion'
import { formatDate } from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'
import { cx } from '../../../lib/cx'

const STEPS = [
  { key: 'modulo', label: 'Módulo', icon: Layers },
  { key: 'estudiantes', label: 'Estudiantes', icon: UsersRound },
  { key: 'fechas', label: 'Fechas', icon: CalendarDays },
  { key: 'confirmar', label: 'Confirmar', icon: Rocket },
]

const TASKS = [
  { key: 'crear', label: 'Crear el módulo' },
  { key: 'estudiantes', label: 'Importar la lista de estudiantes' },
  { key: 'fechas', label: 'Importar las fechas de clase' },
  { key: 'activar', label: 'Activar el nuevo módulo' },
]

function Stepper({ step }) {
  return (
    <ol className={styles.stepper} style={{ '--progress': step / (STEPS.length - 1) }}>
      {STEPS.map((item, index) => {
        const Icon = item.icon
        const done = index < step
        return (
          <li key={item.key} className={cx(styles.step, done && styles.stepDone, index === step && styles.stepCurrent)}>
            <span className={styles.stepBullet}>{done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}</span>
            <span className={styles.stepLabel}>{item.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function RunProgress({ run, onRetry, onReview, onFinish }) {
  const currentIndex = TASKS.findIndex((task) => task.key === run.current)

  if (run.status === 'done') {
    return (
      <div className={styles.success}>
        <span className={styles.successIcon} aria-hidden="true">
          <PartyPopper size={34} />
        </span>
        <h3>¡Módulo activado!</h3>
        <p>
          <strong>{run.result.nombre}</strong> ya es el módulo vigente. Comienza sin registros de asistencia y el módulo anterior quedó
          archivado en la base de datos.
        </p>
        <div className={styles.successStats}>
          <span>
            <UsersRound size={16} aria-hidden="true" /> {run.result.estudiantes} estudiantes
          </span>
          <span>
            <CalendarDays size={16} aria-hidden="true" /> {run.result.clases} clases
          </span>
        </div>
        <div className={styles.successActions}>
          <Button icon={ArrowRight} onClick={() => onFinish('/admin')}>
            Ir al panel general
          </Button>
          <Button variant="secondary" icon={UsersRound} onClick={() => onFinish('/admin/estudiantes')}>
            Ver estudiantes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.run}>
      <ul className={styles.tasks}>
        {TASKS.map((task, index) => {
          const state =
            run.status === 'error' && index === currentIndex
              ? 'error'
              : index < currentIndex
                ? 'done'
                : index === currentIndex
                  ? 'running'
                  : 'pending'
          return (
            <li key={task.key} className={cx(styles.task, styles[`task-${state}`])}>
              <span className={styles.taskIcon} aria-hidden="true">
                {state === 'done' ? (
                  <Check size={16} strokeWidth={3} />
                ) : state === 'running' ? (
                  <Spinner size={16} />
                ) : state === 'error' ? (
                  <CircleX size={16} />
                ) : (
                  index + 1
                )}
              </span>
              {task.label}
            </li>
          )
        })}
      </ul>

      {run.status === 'error' && (
        <div className={styles.runError} role="alert">
          <p>
            <strong>No se pudo completar la activación.</strong> {run.error}
          </p>
          <p className={styles.runErrorNote}>El módulo activo anterior no fue modificado.</p>
          <div className={styles.successActions}>
            <Button icon={RefreshCw} onClick={onRetry}>
              Reintentar
            </Button>
            <Button variant="secondary" icon={FileSpreadsheet} onClick={onReview}>
              Revisar archivos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** RF-13: activa un nuevo módulo con sus estudiantes y fechas, previa confirmación. */
export default function NewModuleWizard({ currentModule }) {
  const { adminEmail } = useAuth()
  const client = useApolloClient()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [nombre, setNombre] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [run, setRun] = useState(null)
  const students = useExcelValidation('estudiantes')
  const dates = useExcelValidation('fechas')

  const [crearModulo] = useMutation(CREAR_MODULO)
  const [importarEstudiantes] = useMutation(IMPORTAR_ESTUDIANTES)
  const [importarFechas] = useMutation(IMPORTAR_FECHAS)
  const [activarModulo] = useMutation(ACTIVAR_MODULO)
  const [eliminarModulo] = useMutation(ELIMINAR_MODULO)

  const nameValid = nombre.trim().length >= 3
  const canContinue = [nameValid, students.valid, dates.valid, acknowledged || !currentModule][step]
  const datePreview = Array.isArray(dates.result?.preview) ? dates.result.preview : []
  const firstDate = datePreview[0]?.fecha

  const execute = async () => {
    let moduloId = null
    let activated = false
    let current = 'crear'
    const advance = (key) => {
      current = key
      setRun({ status: 'running', current: key })
    }

    advance('crear')
    try {
      const created = (await crearModulo({ variables: { nombre: nombre.trim(), activar: false } })).data?.crearModulo
      if (!created?.success) throw new Error(created?.message || 'No se pudo crear el módulo.')
      moduloId = Number(created.modulo.id)

      advance('estudiantes')
      const imported = (
        await importarEstudiantes({
          variables: { moduloId, archivoBase64: students.base64, nombreArchivo: students.file.name, adminEmail },
        })
      ).data?.importarEstudiantesExcel
      if (!imported?.success) throw new Error(imported?.message || 'No se pudieron importar los estudiantes.')

      advance('fechas')
      const scheduled = (
        await importarFechas({
          variables: { moduloId, archivoBase64: dates.base64, nombreArchivo: dates.file.name, adminEmail },
        })
      ).data?.importarFechasExcel
      if (!scheduled?.success) throw new Error(scheduled?.message || 'No se pudieron importar las fechas.')

      advance('activar')
      const activation = (await activarModulo({ variables: { moduloId } })).data?.activarModulo
      if (!activation?.success) throw new Error(activation?.message || 'No se pudo activar el módulo.')
      activated = true

      setRun({
        status: 'done',
        current: 'fin',
        result: { nombre: activation.modulo.nombre, estudiantes: imported.totalImportados, clases: scheduled.totalClases },
      })
      // Toda la información en caché pertenecía al módulo anterior: se descarta y se recargan las vistas activas.
      await client.resetStore()
    } catch (err) {
      // Si falló antes de activar, se elimina el módulo inactivo recién creado para no dejar residuos.
      if (moduloId && !activated) {
        try {
          await eliminarModulo({ variables: { id: moduloId } })
        } catch {
          /* el módulo queda inactivo y no afecta la operación */
        }
      }
      setRun({ status: 'error', current, error: getErrorMessage(err) })
    }
  }

  const finish = (path) => navigate(path)

  if (run) {
    return (
      <Card padding="lg" className={styles.wizardCard}>
        <RunProgress
          run={run}
          onRetry={execute}
          onReview={() => {
            setRun(null)
            setStep(1)
          }}
          onFinish={finish}
        />
      </Card>
    )
  }

  return (
    <Card padding="lg" className={styles.wizardCard}>
      <Stepper step={step} />

      <div key={step} className={styles.stepBody}>
        {step === 0 && (
          <div className={styles.moduleStep}>
            <Field
              label="Nombre del nuevo módulo"
              icon={Layers}
              placeholder="Ej.: Diplomado en Desarrollo Web — Módulo 2"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              error={nombre && !nameValid ? 'Usa al menos 3 caracteres.' : undefined}
              hint="Así lo verán los estudiantes al ingresar."
              maxLength={200}
              autoFocus
            />
            <ul className={styles.overview}>
              <li>
                <UsersRound size={18} aria-hidden="true" />
                <span>
                  <strong>Estudiantes</strong> Excel con número de registro, nombre completo y correo.
                </span>
              </li>
              <li>
                <CalendarDays size={18} aria-hidden="true" />
                <span>
                  <strong>Fechas</strong> Excel con fecha, hora de inicio y hora de fin de cada clase.
                </span>
              </li>
              <li>
                <ShieldCheck size={18} aria-hidden="true" />
                <span>
                  <strong>Sin pérdida de datos</strong> El módulo anterior se conserva en la base de datos.
                </span>
              </li>
            </ul>
          </div>
        )}

        {step === 1 && <ExcelStep kind="estudiantes" validation={students} />}
        {step === 2 && <ExcelStep kind="fechas" validation={dates} />}

        {step === 3 && (
          <div className={styles.confirmStep}>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <Layers size={20} aria-hidden="true" />
                <span>Nuevo módulo</span>
                <strong>{nombre.trim()}</strong>
              </div>
              <div className={styles.summaryCard}>
                <UsersRound size={20} aria-hidden="true" />
                <span>Estudiantes</span>
                <strong className="tabular">{students.result?.totalValidos ?? 0}</strong>
                <small className="truncate">{students.file?.name}</small>
              </div>
              <div className={styles.summaryCard}>
                <CalendarDays size={20} aria-hidden="true" />
                <span>Clases</span>
                <strong className="tabular">{dates.result?.totalValidos ?? 0}</strong>
                <small>{firstDate ? `Desde el ${formatDate(firstDate)}` : dates.file?.name}</small>
              </div>
            </div>

            {currentModule ? (
              <div className={styles.ackBox}>
                <p>
                  El módulo <strong>«{currentModule.nombre}»</strong> dejará de estar activo. Sus estudiantes, fechas, asistencias y
                  actividades se conservarán en la base de datos, pero ya no serán visibles en la operación diaria.
                </p>
                <Switch checked={acknowledged} onChange={setAcknowledged} label="Entiendo y deseo continuar" />
              </div>
            ) : (
              <p className={styles.ackNote}>No hay un módulo activo: el nuevo módulo será el primero en activarse.</p>
            )}
          </div>
        )}
      </div>

      <div className={styles.wizardNav}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep((value) => value - 1)} disabled={step === 0}>
          Atrás
        </Button>
        {step < STEPS.length - 1 ? (
          <Button iconRight={ArrowRight} onClick={() => setStep((value) => value + 1)} disabled={!canContinue}>
            Continuar
          </Button>
        ) : (
          <Button size="lg" icon={Rocket} onClick={() => setConfirming(true)} disabled={!canContinue}>
            Activar nuevo módulo
          </Button>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          title="¿Activar el nuevo módulo?"
          description={nombre.trim()}
          icon={Rocket}
          tone="warn"
          confirmLabel="Sí, activar módulo"
          requireText="ACTIVAR"
          onConfirm={() => {
            setConfirming(false)
            execute()
            return true
          }}
          onClose={() => setConfirming(false)}
        >
          <p>
            Se importarán {students.result?.totalValidos ?? 0} estudiantes y {dates.result?.totalValidos ?? 0} fechas de clase. El nuevo
            módulo empezará sin registros de asistencia.
          </p>
        </ConfirmDialog>
      )}
    </Card>
  )
}
