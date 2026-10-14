import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation } from '@apollo/client/react'
import { ArrowRight, CalendarClock, ChartPie, CircleCheck, CircleX, Clock3, Hourglass, Sparkles } from 'lucide-react'
import styles from './StudentHome.module.css'
import CheckInButton from './CheckInButton'
import { useStudentAttendance } from './useStudentAttendance'
import Card from '../../components/ui/Card'
import RadialMeter from '../../components/ui/RadialMeter'
import ProgressBar from '../../components/ui/ProgressBar'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { Tag } from '../../components/ui/StatusBadge'
import { useAuth } from '../../context/auth-context'
import { useToast } from '../../context/toast-context'
import { useNow } from '../../hooks/useNow'
import { MARCAR_ASISTENCIA } from '../../graphql/asistencia'
import {
  formatClock,
  formatDateLong,
  formatMonthShort,
  formatTime,
  formatTimeRange,
  formatWeekday,
  formatZonedDateLong,
  greetingFor,
  parseISODate,
  relativeDay,
} from '../../lib/dates'
import { getErrorMessage } from '../../lib/errors'
import { capitalize, firstName } from '../../lib/format'
import { cx } from '../../lib/cx'

function Greeting({ name }) {
  const now = useNow(60_000)
  return (
    <div className={styles.greeting}>
      <p className={styles.hello}>
        <Sparkles size={15} aria-hidden="true" /> {greetingFor(now)},
      </p>
      <h1 className={styles.name}>{firstName(name)}</h1>
    </div>
  )
}

function HeroClock() {
  const now = useNow(1000)
  const [hours, minutes, seconds] = formatClock(now).split(':')
  return (
    <div className={styles.clock}>
      <time className={cx(styles.clockTime, 'tabular')} dateTime={now.toISOString()}>
        {hours}
        <span className={styles.colon}>:</span>
        {minutes}
        <span className={styles.seconds}>{seconds}</span>
      </time>
      <p className={styles.clockDate}>{capitalize(formatZonedDateLong(now))}</p>
    </div>
  )
}

function checkInState(loaded, todayItem) {
  if (!loaded) return 'loading'
  if (!todayItem) return 'none'
  if (todayItem.status === 'presente') return 'done'
  if (todayItem.status === 'justificado') return 'justified'
  return todayItem.puedeMarcar ? 'available' : 'closed'
}

function hintFor(state, todayItem, nextItem) {
  switch (state) {
    case 'available':
      return 'Hoy tienes clase. Tu marca guardará la fecha y la hora exactas del servidor.'
    case 'marking':
      return 'Registrando tu asistencia…'
    case 'done':
      return `Registraste tu asistencia hoy a las ${formatTime(todayItem?.horaMarca)}. ¡Buen trabajo!`
    case 'justified':
      return 'Tu inasistencia de hoy fue justificada por el administrador.'
    case 'closed':
      return 'El registro de asistencia de hoy no está disponible.'
    case 'none':
      return nextItem
        ? `Hoy no hay clase programada. Tu próxima clase es el ${formatDateLong(nextItem.fechaProgramada)}.`
        : 'Hoy no hay clase programada y no quedan clases pendientes en este módulo.'
    default:
      return ''
  }
}

function MiniStat({ icon: Icon, label, value, tone }) {
  return (
    <div className={cx(styles.miniStat, styles[tone])}>
      <span className={styles.miniIcon} aria-hidden="true">
        <Icon size={16} strokeWidth={2.4} />
      </span>
      <strong className={styles.miniValue}>{value}</strong>
      <span className={styles.miniLabel}>{label}</span>
    </div>
  )
}

export default function StudentHome() {
  const { session } = useAuth()
  const toast = useToast()
  const estudiante = session.estudiante
  const estudianteId = Number(estudiante.id)
  const { data, error, refetch, items, summary, todayItem, upcoming, elapsed, today } = useStudentAttendance(estudianteId)
  const [marcar, { loading: marking }] = useMutation(MARCAR_ASISTENCIA)
  const [celebrate, setCelebrate] = useState(false)

  const handleMark = async () => {
    try {
      const { data: response } = await marcar({ variables: { estudianteId } })
      const result = response?.marcarAsistencia
      if (result?.success) {
        setCelebrate(true)
        window.setTimeout(() => setCelebrate(false), 2400)
        toast.success(result.message, { title: '¡Asistencia registrada!' })
      } else {
        toast.warning(result?.message ?? 'No se pudo registrar tu asistencia.')
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      refetch()
    }
  }

  if (error && !data) {
    return (
      <Card>
        <ErrorState error={error} onRetry={refetch} />
      </Card>
    )
  }

  const loaded = Boolean(data)
  const baseState = checkInState(loaded, todayItem)
  const state = marking ? 'marking' : baseState
  const nextItem = upcoming[0] ?? null

  return (
    <div className={styles.layout}>
      <section className={cx('glass', styles.hero)} aria-labelledby="checkin-title">
        <div className={styles.heroTop}>
          <Greeting name={estudiante.nombreCompleto} />
          {todayItem ? (
            <Tag tone="accent" icon={Clock3}>
              {todayItem.label} · {formatTimeRange(todayItem.horaInicio, todayItem.horaFin)}
            </Tag>
          ) : (
            loaded && (
              <Tag tone="neutral" icon={CalendarClock}>
                Sin clase hoy
              </Tag>
            )
          )}
        </div>

        <HeroClock />

        <h2 id="checkin-title" className="sr-only">
          Registro de asistencia
        </h2>
        <CheckInButton state={state} onMark={handleMark} celebrate={celebrate} markTime={todayItem?.horaMarca} />

        <p className={styles.hint} aria-live="polite">
          {loaded ? hintFor(state, todayItem, nextItem) : <Skeleton width="70%" height={14} style={{ margin: '0 auto' }} />}
        </p>
      </section>

      <div className={styles.side}>
        <Card
          title="Tu asistencia"
          subtitle="Clases ya evaluadas del módulo"
          icon={ChartPie}
          className="anim-fade-up"
          style={{ '--i': 1 }}
          actions={
            <Link to="/estudiante/historial" className={styles.cardLink}>
              Historial <ArrowRight size={14} />
            </Link>
          }
        >
          {loaded ? (
            <div className={styles.attendance}>
              <RadialMeter
                value={summary.porcentaje}
                size={148}
                stroke={13}
                label="Asistencia"
                caption={`${summary.evaluadas} de ${summary.total} clases`}
              />
              <div className={styles.miniStats}>
                <MiniStat icon={CircleCheck} label="Asistencias" value={summary.presente} tone="ok" />
                <MiniStat icon={CircleX} label="Faltas" value={summary.falta} tone="bad" />
                <MiniStat icon={Hourglass} label="Por cursar" value={summary.programada + summary.pendiente} tone="neutral" />
              </div>
            </div>
          ) : (
            <div className={styles.attendance}>
              <Skeleton width={148} height={148} radius="50%" />
              <Skeleton height={120} radius={16} />
            </div>
          )}
          {loaded && items.length > 0 && (
            <div className={styles.progress}>
              <div className={styles.progressText}>
                <span>Avance del módulo</span>
                <strong className="tabular">
                  {elapsed}/{items.length} clases
                </strong>
              </div>
              <ProgressBar value={elapsed} max={items.length} label="Avance del módulo" />
            </div>
          )}
        </Card>

        <Card title="Próximas clases" icon={CalendarClock} className="anim-fade-up" style={{ '--i': 2 }}>
          {!loaded ? (
            <div className={styles.upcoming}>
              <Skeleton height={60} radius={16} />
              <Skeleton height={60} radius={16} />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState compact icon={CalendarClock} tone="neutral" title="Sin clases pendientes" description="No quedan clases programadas en este módulo." />
          ) : (
            <ul className={styles.upcoming}>
              {upcoming.slice(0, 3).map((item, index) => (
                <li key={item.claseId} className={cx(styles.upcomingItem, 'anim-fade-up')} style={{ '--i': index + 3 }}>
                  <span className={styles.dateBlock}>
                    <span>{formatMonthShort(item.fechaProgramada)}</span>
                    <strong>{parseISODate(item.fechaProgramada).getDate()}</strong>
                  </span>
                  <span className={styles.upcomingText}>
                    <strong>{item.label}</strong>
                    <span>
                      {formatWeekday(item.fechaProgramada)} · {formatTimeRange(item.horaInicio, item.horaFin)}
                    </span>
                  </span>
                  <span className={styles.relative}>{relativeDay(item.fechaProgramada, today)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
