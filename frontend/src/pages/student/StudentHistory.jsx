import { useMemo, useState } from 'react'
import { CalendarClock, CalendarX, ChartPie, CircleCheck, CircleX, Clock3, ShieldCheck } from 'lucide-react'
import styles from './StudentHistory.module.css'
import { useStudentAttendance } from './useStudentAttendance'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatTile from '../../components/ui/StatTile'
import SegmentedControl from '../../components/ui/SegmentedControl'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/auth-context'
import { severityOf } from '../../lib/attendance'
import { formatMonthShort, formatMonthYear, formatTime, formatTimeRange, formatWeekday, parseISODate } from '../../lib/dates'
import { cx } from '../../lib/cx'

const FILTERS = {
  todas: () => true,
  presentes: (item) => item.status === 'presente',
  ausencias: (item) => item.status === 'falta' || item.status === 'justificado',
  proximas: (item) => item.status === 'programada' || item.status === 'pendiente',
}

function groupByMonth(items) {
  const groups = []
  for (const item of items) {
    const key = item.fechaProgramada.slice(0, 7)
    let group = groups.at(-1)
    if (!group || group.key !== key) {
      group = { key, label: formatMonthYear(item.fechaProgramada), items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

function HistoryRow({ item, index }) {
  const date = parseISODate(item.fechaProgramada)
  return (
    <li className={cx(styles.row, item.timing === 'hoy' && styles.today, 'anim-fade-up')} style={{ '--i': Math.min(index, 10) }}>
      <span className={cx(styles.dateBlock, styles[item.status])}>
        <span>{formatWeekday(item.fechaProgramada)}</span>
        <strong>{date.getDate()}</strong>
        <span>{formatMonthShort(item.fechaProgramada)}</span>
      </span>
      <div className={styles.info}>
        <strong className={styles.title}>
          {item.label}
          {item.timing === 'hoy' && <span className={styles.todayChip}>Hoy</span>}
        </strong>
        <span className={styles.meta}>
          <Clock3 size={13} aria-hidden="true" /> {formatTimeRange(item.horaInicio, item.horaFin)}
        </span>
      </div>
      <div className={styles.mark}>
        {item.status === 'presente' && item.horaMarca ? (
          <>
            <span className={styles.markLabel}>Marcó a las</span>
            <span className={cx(styles.markTime, 'tabular')}>{formatTime(item.horaMarca)}</span>
          </>
        ) : (
          <span className={styles.markEmpty}>—</span>
        )}
      </div>
      <StatusBadge status={item.status} />
    </li>
  )
}

export default function StudentHistory() {
  const { session } = useAuth()
  const { data, error, refetch, items, summary } = useStudentAttendance(Number(session.estudiante.id))
  const [filter, setFilter] = useState('todas')

  const counts = useMemo(
    () => Object.fromEntries(Object.entries(FILTERS).map(([key, test]) => [key, items.filter(test).length])),
    [items],
  )
  const groups = useMemo(() => groupByMonth(items.filter(FILTERS[filter])), [items, filter])
  const loading = !data && !error

  return (
    <>
      <PageHeader
        eyebrow="Mi historial"
        title="Historial de asistencia"
        description="Todas las fechas del módulo activo con tu estado y la hora exacta de cada marca."
      />

      <div className={styles.stats}>
        <StatTile label="Asistencias" value={summary.presente} icon={CircleCheck} tone="ok" loading={loading} index={0} />
        <StatTile label="Faltas" value={summary.falta} icon={CircleX} tone="bad" loading={loading} index={1} />
        <StatTile label="Justificadas" value={summary.justificado} icon={ShieldCheck} tone="warn" loading={loading} index={2} />
        <StatTile
          label="Asistencia"
          value={summary.porcentaje ?? undefined}
          suffix="%"
          icon={ChartPie}
          tone={severityOf(summary.porcentaje) === 'neutral' ? 'accent' : severityOf(summary.porcentaje)}
          loading={loading}
          hint={`${summary.evaluadas} de ${summary.total} clases evaluadas`}
          index={3}
        />
      </div>

      <Card padding="none" className="anim-fade-up" style={{ '--i': 4 }}>
        <div className={styles.toolbar}>
          <SegmentedControl
            ariaLabel="Filtrar historial"
            value={filter}
            onChange={setFilter}
            size="sm"
            options={[
              { value: 'todas', label: 'Todas', count: counts.todas },
              { value: 'presentes', label: 'Presentes', count: counts.presentes },
              { value: 'ausencias', label: 'Ausencias', count: counts.ausencias },
              { value: 'proximas', label: 'Próximas', count: counts.proximas },
            ]}
          />
        </div>

        <div className={styles.body}>
          {error && !data ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : loading ? (
            <SkeletonRows rows={5} height={72} />
          ) : groups.length === 0 ? (
            <EmptyState
              icon={filter === 'proximas' ? CalendarClock : CalendarX}
              tone="neutral"
              title="No hay fechas en esta vista"
              description="Prueba con otro filtro para ver el resto de tu historial."
            />
          ) : (
            groups.map((group) => (
              <section key={group.key} className={styles.group}>
                <h2 className={styles.month}>{group.label}</h2>
                <ul className={styles.list}>
                  {group.items.map((item, index) => (
                    <HistoryRow key={item.claseId} item={item} index={index} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </Card>
    </>
  )
}
