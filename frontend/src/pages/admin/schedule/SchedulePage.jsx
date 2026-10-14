import { useMemo, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  Hourglass,
  Pencil,
  Rocket,
  Trash2,
} from 'lucide-react'
import styles from './Schedule.module.css'
import MonthCalendar from './MonthCalendar'
import ClassFormModal from './ClassFormModal'
import { useAttendanceModel } from '../useAttendanceModel'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import LinkButton from '../../../components/ui/LinkButton'
import StatTile from '../../../components/ui/StatTile'
import ProgressBar from '../../../components/ui/ProgressBar'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Skeleton, { SkeletonRows } from '../../../components/ui/Skeleton'
import { Tag } from '../../../components/ui/StatusBadge'
import { useToast } from '../../../context/toast-context'
import { ELIMINAR_CLASE } from '../../../graphql/modulo'
import { SCHEDULE_REFETCH } from '../../../graphql/refetch'
import { severityOf } from '../../../lib/attendance'
import {
  formatDate,
  formatDateLong,
  formatMonthShort,
  formatMonthYear,
  formatTimeRange,
  formatWeekday,
  parseISODate,
  relativeDay,
  shiftMonth,
} from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'
import { capitalize, formatPercent } from '../../../lib/format'
import { cx } from '../../../lib/cx'

const TIMING_TAG = {
  pasada: { tone: 'neutral', label: 'Dictada', icon: CalendarCheck },
  hoy: { tone: 'ok', label: 'Hoy', icon: Clock3 },
  futura: { tone: 'accent', label: 'Programada', icon: CalendarClock },
}

function groupByMonth(classes) {
  const groups = []
  for (const clase of classes) {
    const key = clase.fechaProgramada.slice(0, 7)
    let group = groups.at(-1)
    if (!group || group.key !== key) {
      group = { key, label: formatMonthYear(clase.fechaProgramada), items: [] }
      groups.push(group)
    }
    group.items.push(clase)
  }
  return groups
}

export default function SchedulePage() {
  const toast = useToast()
  const { modulo, model, today, ready, error, refetch } = useAttendanceModel()
  const [month, setMonth] = useState(null)
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [eliminar] = useMutation(ELIMINAR_CLASE)

  const classes = model.classes
  const classesByDate = useMemo(() => new Map(classes.map((clase) => [clase.fechaProgramada, clase])), [classes])
  const groups = useMemo(() => groupByMonth(classes), [classes])
  const focusClass = classes.find((clase) => clase.timing !== 'pasada') ?? classes.at(-1)
  const currentMonth = month ?? (focusClass?.fechaProgramada ?? today).slice(0, 7)

  const held = classes.filter((clase) => clase.timing !== 'futura').length
  const remaining = classes.length - held
  const next = classes.find((clase) => clase.timing !== 'pasada')

  const handleDelete = async () => {
    try {
      const { data } = await eliminar({
        variables: { id: Number(deleting.id) },
        refetchQueries: [...SCHEDULE_REFETCH, 'HistorialActividades'],
        awaitRefetchQueries: true,
      })
      const result = data?.eliminarClase
      if (!result?.success) {
        toast.error(result?.message ?? 'No se pudo eliminar la clase.')
        return false
      }
      toast.success(`Se eliminó la clase del ${formatDateLong(deleting.fechaProgramada)}.`, { title: 'Clase eliminada' })
      return true
    } catch (err) {
      toast.error(getErrorMessage(err))
      return false
    }
  }

  const header = (
    <PageHeader
      eyebrow="Módulo activo"
      title="Calendario de clases"
      description="Las fechas programadas determinan los días habilitados para marcar asistencia. Los horarios son informativos."
      actions={
        modulo && (
          <Button icon={CalendarPlus} onClick={() => setForm({})}>
            Programar clase
          </Button>
        )
      }
    />
  )

  if (error && !ready) {
    return (
      <>
        {header}
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      </>
    )
  }

  if (ready && !modulo) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={Rocket}
            title="No hay un módulo activo"
            description="Activa un módulo e importa su calendario de clases."
            action={
              <LinkButton to="/admin/importar" icon={FileSpreadsheet}>
                Activar módulo
              </LinkButton>
            }
          />
        </Card>
      </>
    )
  }

  return (
    <>
      {header}

      <div className={styles.stats}>
        <StatTile label="Clases programadas" value={classes.length} icon={CalendarDays} loading={!ready} index={0} hint="Total del módulo" />
        <StatTile label="Dictadas" value={held} icon={CalendarCheck} tone="ok" loading={!ready} index={1} hint="Incluye la de hoy" />
        <StatTile label="Restantes" value={remaining} icon={Hourglass} tone="info" loading={!ready} index={2} hint="Por dictar" />
        <StatTile
          label="Próxima clase"
          value={next ? relativeDay(next.fechaProgramada, today) : 'Ninguna'}
          icon={CalendarClock}
          tone="accent"
          loading={!ready}
          index={3}
          hint={next ? capitalize(formatDate(next.fechaProgramada, { weekday: 'long', day: 'numeric', month: 'long' })) : 'No quedan clases'}
        />
      </div>

      <div className={styles.layout}>
        <Card
          className={cx(styles.calendarCard, 'anim-fade-up')}
          style={{ '--i': 4 }}
          title={capitalize(formatMonthYear(`${currentMonth}-01`))}
          icon={CalendarDays}
          actions={
            <div className={styles.monthNav}>
              <Button size="sm" variant="ghost" icon={ChevronLeft} onClick={() => setMonth(shiftMonth(currentMonth, -1))} aria-label="Mes anterior" />
              <Button size="sm" variant="secondary" onClick={() => setMonth(today.slice(0, 7))}>
                Hoy
              </Button>
              <Button size="sm" variant="ghost" icon={ChevronRight} onClick={() => setMonth(shiftMonth(currentMonth, 1))} aria-label="Mes siguiente" />
            </div>
          }
        >
          {ready ? (
            <MonthCalendar
              month={currentMonth}
              classesByDate={classesByDate}
              today={today}
              onSelectDay={(iso, clase) => (clase ? setForm({ clase }) : setForm({ defaultDate: iso }))}
            />
          ) : (
            <Skeleton height={340} radius={18} />
          )}
          <ul className={styles.calendarLegend}>
            <li>
              <i className={cx(styles.legendDot, styles.legendPast)} /> Dictada (% de asistencia)
            </li>
            <li>
              <i className={cx(styles.legendDot, styles.legendToday)} /> Hoy
            </li>
            <li>
              <i className={cx(styles.legendDot, styles.legendFuture)} /> Programada
            </li>
          </ul>
        </Card>

        <Card
          title="Fechas del módulo"
          subtitle={`${classes.length} ${classes.length === 1 ? 'clase' : 'clases'} en total`}
          icon={CalendarClock}
          padding="none"
          className="anim-fade-up"
          style={{ '--i': 5 }}
        >
          {!ready ? (
            <div className={styles.pad}>
              <SkeletonRows rows={5} height={64} />
            </div>
          ) : classes.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              tone="neutral"
              title="Sin fechas programadas"
              description="Programa clases manualmente o importa el calendario desde Excel."
              action={
                <LinkButton to="/admin/importar?modo=actualizar" variant="secondary" icon={FileSpreadsheet}>
                  Importar calendario
                </LinkButton>
              }
            />
          ) : (
            <div className={styles.classList}>
              {groups.map((group) => (
                <section key={group.key} className={styles.group}>
                  <h3 className={styles.groupTitle}>{group.label}</h3>
                  <ul className={styles.groupItems}>
                    {group.items.map((clase) => {
                      const tag = TIMING_TAG[clase.timing]
                      const severity = severityOf(clase.rate)
                      return (
                        <li key={clase.id} className={cx(styles.classItem, clase.timing === 'hoy' && styles.classToday)}>
                          <span className={cx(styles.dateBlock, styles[`timing-${clase.timing}`])}>
                            <span>{formatWeekday(clase.fechaProgramada)}</span>
                            <strong>{parseISODate(clase.fechaProgramada).getDate()}</strong>
                            <span>{formatMonthShort(clase.fechaProgramada)}</span>
                          </span>
                          <div className={styles.classInfo}>
                            <strong className="truncate">{clase.label}</strong>
                            <span>
                              <Clock3 size={13} aria-hidden="true" /> {formatTimeRange(clase.horaInicio, clase.horaFin)}
                            </span>
                            {clase.rate != null && (
                              <span className={styles.classRate}>
                                <ProgressBar value={clase.rate} tone={severity} size="sm" label="Asistencia" />
                                <strong className="tabular">{formatPercent(clase.rate)}</strong>
                              </span>
                            )}
                          </div>
                          <Tag tone={tag.tone} icon={tag.icon} size="sm">
                            {tag.label}
                          </Tag>
                          <div className={styles.classActions}>
                            <button type="button" className={styles.iconAction} onClick={() => setForm({ clase })} aria-label={`Editar ${clase.label}`} title="Editar">
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className={cx(styles.iconAction, styles.iconDanger)}
                              onClick={() => setDeleting(clase)}
                              aria-label={`Eliminar ${clase.label}`}
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Card>
      </div>

      {form && (
        <ClassFormModal
          clase={form.clase}
          defaultDate={form.defaultDate}
          moduloId={modulo?.id}
          classes={classes}
          onClose={() => setForm(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar fecha de clase"
          description={`${deleting.label} · ${formatDateLong(deleting.fechaProgramada)}`}
          icon={Trash2}
          confirmLabel="Eliminar clase"
          requireText={deleting.timing === 'futura' ? undefined : 'ELIMINAR'}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        >
          <p>
            {deleting.timing === 'futura'
              ? 'La fecha dejará de estar habilitada para marcar asistencia.'
              : 'Esta clase ya tiene registros: al eliminarla también se borrarán sus asistencias. Esta acción no se puede deshacer.'}
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
