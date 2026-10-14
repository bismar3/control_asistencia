import { Link } from 'react-router'
import { useQuery } from '@apollo/client/react'
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  ChartColumn,
  ChartPie,
  CircleX,
  ClipboardCheck,
  FileSpreadsheet,
  History,
  Rocket,
  TriangleAlert,
  UserCheck,
  UsersRound,
} from 'lucide-react'
import styles from './DashboardPage.module.css'
import { useAttendanceModel } from '../useAttendanceModel'
import Card from '../../../components/ui/Card'
import StatTile from '../../../components/ui/StatTile'
import ProgressBar from '../../../components/ui/ProgressBar'
import LinkButton from '../../../components/ui/LinkButton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Skeleton, { SkeletonRows } from '../../../components/ui/Skeleton'
import Avatar from '../../../components/ui/Avatar'
import LiveDot from '../../../components/ui/LiveDot'
import { Tag } from '../../../components/ui/StatusBadge'
import AttendanceColumns from '../../../components/charts/AttendanceColumns'
import StatusStackBar from '../../../components/charts/StatusStackBar'
import ActivityItem from '../../../components/activity/ActivityItem'
import { useAuth } from '../../../context/auth-context'
import { useCountUp } from '../../../hooks/useCountUp'
import { ASISTENCIAS_POR_CLASE } from '../../../graphql/asistencia'
import { HISTORIAL_ACTIVIDADES } from '../../../graphql/actividad'
import { severityOf } from '../../../lib/attendance'
import { formatDate, formatDateLong, formatDateTime, formatTimeRange } from '../../../lib/dates'
import { firstName, formatPercent } from '../../../lib/format'
import { cx } from '../../../lib/cx'

const SEVERITY_TEXT = {
  ok: 'Asistencia saludable',
  warn: 'Asistencia en observación',
  bad: 'Asistencia crítica',
  neutral: 'Sin clases evaluadas',
}

function HeroFigure({ value }) {
  const animated = useCountUp(value ?? 0, 1200)
  if (value == null) return <span className={styles.figureEmpty}>Sin datos aún</span>
  return <span className={styles.figureValue}>{formatPercent(animated, 1)}</span>
}

function NoModule() {
  return (
    <Card padding="lg">
      <EmptyState
        icon={Rocket}
        title="Aún no hay un módulo activo"
        description="Importa la lista de estudiantes y el calendario de clases desde Excel para comenzar a registrar asistencias."
        action={
          <LinkButton to="/admin/importar" icon={FileSpreadsheet}>
            Activar un módulo
          </LinkButton>
        }
      />
    </Card>
  )
}

function TodayLive({ todayClass, totalStudents, nextClass }) {
  const { data } = useQuery(ASISTENCIAS_POR_CLASE, {
    variables: { claseId: Number(todayClass?.id) },
    skip: !todayClass,
    pollInterval: 15_000,
    notifyOnNetworkStatusChange: false,
  })

  if (!todayClass) {
    return (
      <Card title="Clase de hoy" icon={CalendarClock}>
        <EmptyState
          compact
          icon={CalendarClock}
          tone="neutral"
          title="Hoy no hay clase programada"
          description={
            nextClass
              ? `La próxima clase es el ${formatDateLong(nextClass.fechaProgramada)} (${formatTimeRange(nextClass.horaInicio, nextClass.horaFin)}).`
              : 'No quedan clases programadas en este módulo.'
          }
        />
      </Card>
    )
  }

  const records = data?.asistenciasPorClase ?? []
  const present = records
    .filter((record) => record.estado === 'PRESENTE')
    .sort((a, b) => (b.fechaHoraMarca ?? '').localeCompare(a.fechaHoraMarca ?? ''))
  const count = data ? present.length : (todayClass.totalPresentes ?? 0)

  return (
    <Card
      title="Clase de hoy"
      subtitle={`${todayClass.label} · ${formatTimeRange(todayClass.horaInicio, todayClass.horaFin)}`}
      icon={CalendarCheck}
      actions={
        <span className={styles.livePill}>
          <LiveDot tone="ok" /> En vivo
        </span>
      }
    >
      <div className={styles.liveHead}>
        <p className={styles.liveCount}>
          <strong className="tabular">{count}</strong>
          <span>/ {totalStudents} presentes</span>
        </p>
        <span className={styles.livePct}>{formatPercent(totalStudents ? (count / totalStudents) * 100 : 0)}</span>
      </div>
      <ProgressBar value={count} max={Math.max(totalStudents, 1)} tone="ok" label="Presentes hoy" />

      {!data ? (
        <SkeletonRows rows={3} height={48} />
      ) : present.length === 0 ? (
        <p className={styles.liveEmpty}>Aún nadie registró su asistencia. La lista se actualiza automáticamente.</p>
      ) : (
        <ul className={styles.liveList}>
          {present.slice(0, 6).map((record, index) => (
            <li key={record.id} className="anim-fade-up" style={{ '--i': index }}>
              <Avatar name={record.estudiante.nombreCompleto} size={34} />
              <span className={styles.liveName}>
                <strong className="truncate">{record.estudiante.nombreCompleto}</strong>
                <span className="mono">{record.estudiante.nroRegistro}</span>
              </span>
              <time className={cx(styles.liveTime, 'tabular')}>
                {formatDateTime(record.fechaHoraMarca, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </time>
            </li>
          ))}
        </ul>
      )}
      <Link to="/admin/asistencias" className={styles.cardLink}>
        Ver lista completa <ArrowRight size={14} />
      </Link>
    </Card>
  )
}

function AtRisk({ students }) {
  const ranked = students
    .filter((student) => student.summary.evaluadas > 0)
    .sort((a, b) => a.summary.porcentaje - b.summary.porcentaje || b.summary.falta - a.summary.falta)
    .slice(0, 5)

  return (
    <Card title="Requieren atención" subtitle="Estudiantes con menor porcentaje de asistencia" icon={TriangleAlert}>
      {ranked.length === 0 ? (
        <EmptyState compact icon={UserCheck} tone="ok" title="Todo en orden" description="Aún no hay clases evaluadas para comparar." />
      ) : (
        <ul className={styles.riskList}>
          {ranked.map((student, index) => {
            const severity = severityOf(student.summary.porcentaje)
            return (
              <li key={student.id} className="anim-fade-up" style={{ '--i': index }}>
                <Link to={`/admin/estudiantes?buscar=${encodeURIComponent(student.nroRegistro)}`} className={styles.riskItem}>
                  <Avatar name={student.nombreCompleto} size={36} />
                  <span className={styles.riskInfo}>
                    <strong className="truncate">{student.nombreCompleto}</strong>
                    <span>
                      {student.summary.falta} {student.summary.falta === 1 ? 'falta' : 'faltas'} · {student.summary.evaluadas} evaluadas
                    </span>
                  </span>
                  <span className={styles.riskMeter}>
                    <ProgressBar value={student.summary.porcentaje} tone={severity} size="sm" label="Asistencia" />
                    <strong className={cx('tabular', styles[`text-${severity}`])}>{formatPercent(student.summary.porcentaje)}</strong>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function RecentActivity() {
  const { data, loading } = useQuery(HISTORIAL_ACTIVIDADES, {
    variables: { limite: 6 },
    pollInterval: 30_000,
    notifyOnNetworkStatusChange: false,
  })
  const activities = data?.historialActividades ?? []

  return (
    <Card
      title="Actividad reciente"
      subtitle="Últimas acciones registradas en el módulo"
      icon={History}
      actions={
        <Link to="/admin/actividad" className={styles.cardLinkInline}>
          Ver todo <ArrowRight size={14} />
        </Link>
      }
    >
      {loading && !data ? (
        <SkeletonRows rows={4} height={56} />
      ) : activities.length === 0 ? (
        <EmptyState compact icon={History} tone="neutral" title="Sin actividad todavía" />
      ) : (
        <ul className={styles.activityList}>
          {activities.map((activity, index) => (
            <ActivityItem key={activity.id} activity={activity} compact index={index} />
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function DashboardPage() {
  const { session } = useAuth()
  const { modulo, model, ready, error, refetch } = useAttendanceModel({ pollInterval: 60_000 })

  if (error && !ready) {
    return (
      <Card>
        <ErrorState error={error} onRetry={refetch} />
      </Card>
    )
  }

  if (ready && !modulo) return <NoModule />

  const { classes, overall, totalStudents, students } = model
  const totalClasses = classes.length
  const held = classes.filter((clase) => clase.timing !== 'futura').length
  const todayClass = classes.find((clase) => clase.timing === 'hoy')
  const nextClass = classes.find((clase) => clase.timing === 'futura')
  const severity = severityOf(overall.porcentaje)
  const adminName = firstName(session?.administrador?.nombreCompleto || 'Administrador')
  const first = classes[0]?.fechaProgramada
  const last = classes.at(-1)?.fechaProgramada

  return (
    <>
      <section className={cx('glass', styles.hero)}>
        <div className={styles.heroMain}>
          <p className={styles.eyebrow}>
            <LiveDot tone="ok" /> Hola, {adminName} · Módulo activo
          </p>
          {ready ? <h1 className={styles.heroTitle}>{modulo.nombre}</h1> : <Skeleton width="70%" height={40} />}
          <p className={styles.heroMeta}>
            <span>
              <CalendarRange size={15} aria-hidden="true" />
              {first ? `${formatDate(first)} – ${formatDate(last)}` : 'Sin fechas programadas'}
            </span>
            <span>
              <UsersRound size={15} aria-hidden="true" /> {totalStudents} estudiantes
            </span>
          </p>
          <div className={styles.heroProgress}>
            <div className={styles.heroProgressText}>
              <span>Avance del módulo</span>
              <strong className="tabular">
                {held} de {totalClasses} clases
              </strong>
            </div>
            <ProgressBar value={held} max={Math.max(totalClasses, 1)} label="Avance del módulo" />
          </div>
          <div className={styles.heroActions}>
            <LinkButton to="/admin/asistencias" icon={ClipboardCheck}>
              Gestionar asistencias
            </LinkButton>
            <LinkButton to="/admin/importar" variant="secondary" icon={FileSpreadsheet}>
              Importar datos
            </LinkButton>
          </div>
        </div>

        <div className={cx(styles.figure, styles[severity])}>
          <span className={styles.figureLabel}>Asistencia general</span>
          {ready ? <HeroFigure value={overall.porcentaje} /> : <Skeleton width={180} height={64} />}
          <span className={styles.figureHint}>
            {overall.presente} presentes de {overall.evaluadas} registros evaluados
          </span>
          <Tag tone={severity === 'neutral' ? 'neutral' : severity}>{SEVERITY_TEXT[severity]}</Tag>
        </div>
      </section>

      <div className={styles.kpis}>
        <StatTile label="Estudiantes inscritos" value={totalStudents} icon={UsersRound} loading={!ready} hint="Lista del módulo activo" index={0} />
        <StatTile
          label="Clases dictadas"
          value={held}
          icon={CalendarCheck}
          tone="info"
          loading={!ready}
          hint={`de ${totalClasses} programadas`}
          index={1}
        />
        <StatTile
          label="Faltas registradas"
          value={overall.falta}
          icon={CircleX}
          tone="bad"
          loading={!ready}
          hint={`${overall.justificado} justificadas aparte`}
          index={2}
        />
        <StatTile
          label="Presentes hoy"
          value={todayClass ? todayClass.summary.presente : 'Sin clase'}
          icon={UserCheck}
          tone="ok"
          loading={!ready}
          hint={
            todayClass
              ? `de ${totalStudents} · ${todayClass.label}`
              : nextClass
                ? `Próxima: ${formatDate(nextClass.fechaProgramada, { weekday: 'short', day: 'numeric', month: 'short' })}`
                : 'No quedan clases'
          }
          index={3}
        />
      </div>

      <div className={styles.chartsRow}>
        <Card
          title="Asistencia por clase"
          subtitle="Porcentaje de estudiantes presentes en cada fecha"
          icon={ChartColumn}
          className={cx(styles.wide, 'anim-fade-up')}
          style={{ '--i': 4 }}
        >
          {ready ? (
            totalClasses ? (
              <AttendanceColumns classes={classes} totalStudents={totalStudents} />
            ) : (
              <EmptyState compact icon={CalendarClock} tone="neutral" title="Sin fechas de clase" description="Importa el calendario para ver el gráfico." />
            )
          ) : (
            <Skeleton height={260} radius={16} />
          )}
        </Card>
        <Card title="Distribución de estados" subtitle="Registros de clases ya evaluadas" icon={ChartPie} className="anim-fade-up" style={{ '--i': 5 }}>
          {ready ? <StatusStackBar summary={overall} /> : <SkeletonRows rows={4} height={44} />}
        </Card>
      </div>

      <div className={styles.twoCols}>
        {ready ? (
          <TodayLive todayClass={todayClass} totalStudents={totalStudents} nextClass={nextClass} />
        ) : (
          <Skeleton height={320} radius={26} />
        )}
        {ready ? <AtRisk students={students} /> : <Skeleton height={320} radius={26} />}
      </div>

      <RecentActivity />
    </>
  )
}
