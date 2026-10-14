import { useMemo, useState } from 'react'
import { NetworkStatus } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { CalendarSearch, ChevronDown, FilterX, History, ListFilter, RefreshCw } from 'lucide-react'
import styles from './ActivityPage.module.css'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Field from '../../../components/ui/Field'
import SearchInput from '../../../components/ui/SearchInput'
import Switch from '../../../components/ui/Switch'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import LiveDot from '../../../components/ui/LiveDot'
import { SkeletonRows } from '../../../components/ui/Skeleton'
import ActivityItem from '../../../components/activity/ActivityItem'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useToday } from '../../../hooks/useNow'
import { HISTORIAL_ACTIVIDADES } from '../../../graphql/actividad'
import { ACTION_META, ACTION_OPTIONS } from '../../../lib/activity'
import { dayGroupLabel, zonedDateOf } from '../../../lib/dates'
import { cx } from '../../../lib/cx'

const PAGE_SIZE = 100

function groupByDay(activities, today) {
  const groups = []
  for (const activity of activities) {
    const day = zonedDateOf(activity.fechaHora)
    let group = groups.at(-1)
    if (!group || group.day !== day) {
      group = { day, label: dayGroupLabel(day, today), items: [] }
      groups.push(group)
    }
    group.items.push(activity)
  }
  return groups
}

/** RF-10: historial de acciones del módulo activo, filtrable por estudiante, fecha y tipo. */
export default function ActivityPage() {
  const today = useToday()
  const [search, setSearch] = useState('')
  const [fecha, setFecha] = useState('')
  const [accion, setAccion] = useState('')
  const [limite, setLimite] = useState(PAGE_SIZE)
  const [hideLogins, setHideLogins] = useState(false)
  const busqueda = useDebouncedValue(search.trim(), 350)

  const { data, previousData, networkStatus, error, refetch } = useQuery(HISTORIAL_ACTIVIDADES, {
    variables: { busqueda: busqueda || null, fecha: fecha || null, accion: accion || null, limite },
    pollInterval: 30_000,
  })

  const activities = useMemo(() => (data ?? previousData)?.historialActividades ?? [], [data, previousData])
  const visible = useMemo(
    () => (hideLogins ? activities.filter((activity) => activity.accion !== 'LOGIN') : activities),
    [activities, hideLogins],
  )
  const groups = useMemo(() => groupByDay(visible, today), [visible, today])
  const counts = useMemo(() => {
    const result = {}
    for (const activity of activities) result[activity.accion] = (result[activity.accion] ?? 0) + 1
    return result
  }, [activities])

  const hasFilters = Boolean(search || fecha || accion || hideLogins)
  const canLoadMore = activities.length >= limite
  // El sondeo en segundo plano no atenúa la lista; solo los cambios de filtro y el refresco manual.
  const refreshing =
    (networkStatus === NetworkStatus.setVariables || networkStatus === NetworkStatus.refetch) && Boolean(data ?? previousData)

  const clearFilters = () => {
    setSearch('')
    setFecha('')
    setAccion('')
    setHideLogins(false)
    setLimite(PAGE_SIZE)
  }

  return (
    <>
      <PageHeader
        eyebrow="Auditoría"
        title="Historial de actividad"
        description="Marcas de asistencia, modificaciones administrativas, importaciones e ingresos al sistema del módulo activo."
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()} loading={refreshing}>
            Actualizar
          </Button>
        }
      />

      <div className={cx('glass', styles.filters)}>
        <SearchInput
          className={styles.search}
          value={search}
          onChange={setSearch}
          placeholder="Estudiante, nº de registro o correo…"
          label="Buscar en el historial"
        />
        <Field
          type="date"
          icon={CalendarSearch}
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          aria-label="Filtrar por fecha"
          className={styles.dateField}
          max={today}
        />
        <Field as="select" icon={ListFilter} value={accion} onChange={(event) => setAccion(event.target.value)} aria-label="Tipo de acción" className={styles.selectField}>
          <option value="">Todas las acciones</option>
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Field>
        <Switch checked={hideLogins} onChange={setHideLogins} label="Ocultar inicios de sesión" />
        {hasFilters && (
          <Button variant="ghost" size="sm" icon={FilterX} onClick={clearFilters}>
            Limpiar
          </Button>
        )}
      </div>

      <div className={styles.chips} role="group" aria-label="Filtrar por tipo de acción">
        {Object.entries(ACTION_META).map(([key, meta]) => {
          const Icon = meta.icon
          const active = accion === key
          return (
            <button
              key={key}
              type="button"
              className={cx(styles.chip, styles[`tone-${meta.tone}`], active && styles.chipActive)}
              onClick={() => setAccion(active ? '' : key)}
              aria-pressed={active}
            >
              <Icon size={15} strokeWidth={2.3} aria-hidden="true" />
              {meta.label}
              <span className={cx(styles.chipCount, 'tabular')}>{counts[key] ?? 0}</span>
            </button>
          )
        })}
      </div>

      <Card padding="none" className={cx(styles.timelineCard, refreshing && styles.refreshing)}>
        <div className={styles.cardHead}>
          <span className={styles.liveLabel}>
            <LiveDot tone="ok" /> Actualización automática cada 30 s
          </span>
          <span className={styles.total}>
            {visible.length} {visible.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {error && !data && !previousData ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !data && !previousData ? (
          <div className={styles.pad}>
            <SkeletonRows rows={6} height={78} />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={History}
            tone="neutral"
            title={hasFilters ? 'Sin resultados para estos filtros' : 'Todavía no hay actividad'}
            description={hasFilters ? 'Prueba con otro término, fecha o tipo de acción.' : 'Las acciones del módulo activo aparecerán aquí.'}
            action={
              hasFilters && (
                <Button variant="secondary" icon={FilterX} onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )
            }
          />
        ) : (
          <div className={styles.timeline}>
            {groups.map((group) => (
              <section key={group.day} className={styles.day}>
                <h2 className={styles.dayTitle}>
                  <span>{group.label}</span>
                  <span className={styles.dayCount}>{group.items.length}</span>
                </h2>
                <ul className={styles.items}>
                  {group.items.map((activity, index) => (
                    <ActivityItem key={activity.id} activity={activity} index={index} />
                  ))}
                </ul>
              </section>
            ))}

            {canLoadMore && (
              <div className={styles.more}>
                <Button variant="secondary" icon={ChevronDown} loading={refreshing} onClick={() => setLimite((value) => value + PAGE_SIZE)}>
                  Cargar más registros
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  )
}
