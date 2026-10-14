import { useMemo, useState } from 'react'
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react'
import { CircleCheck, CircleX, Clock3, PenLine, ShieldCheck, UsersRound, X } from 'lucide-react'
import styles from './Attendance.module.css'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'
import Button from '../../../components/ui/Button'
import StatusPicker from '../../../components/ui/StatusPicker'
import SegmentedControl from '../../../components/ui/SegmentedControl'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import ProgressBar from '../../../components/ui/ProgressBar'
import { SkeletonRows } from '../../../components/ui/Skeleton'
import { Tag } from '../../../components/ui/StatusBadge'
import { useAuth } from '../../../context/auth-context'
import { useToast } from '../../../context/toast-context'
import { ASISTENCIAS_POR_CLASE, MODIFICAR_ASISTENCIA } from '../../../graphql/asistencia'
import { ATTENDANCE_REFETCH } from '../../../graphql/refetch'
import { EDITABLE_STATES, resolveStatus, STATUS, summarize } from '../../../lib/attendance'
import { runPool } from '../../../lib/async'
import { formatDateLong, formatDateTime, formatTimeRange } from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'
import { capitalize, formatPercent, normalizeText } from '../../../lib/format'
import { cx } from '../../../lib/cx'

const ESTADO_LABEL = Object.fromEntries(EDITABLE_STATES.map((option) => [option.value, option.label]))
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit', second: '2-digit' }
const BULK_ICONS = { PRESENTE: CircleCheck, FALTA: CircleX, JUSTIFICADO: ShieldCheck }

const byName = (a, b) =>
  a.estudiante.apellidoPaterno.localeCompare(b.estudiante.apellidoPaterno, 'es') ||
  a.estudiante.nombre.localeCompare(b.estudiante.nombre, 'es')

function SummaryPill({ tone, icon: Icon, label, value, total }) {
  return (
    <div className={cx(styles.summaryPill, styles[`tone-${tone}`])}>
      <span className={styles.summaryIcon} aria-hidden="true">
        <Icon size={16} strokeWidth={2.4} />
      </span>
      <span className={styles.summaryText}>
        <strong className="tabular">{value}</strong>
        <span>{label}</span>
      </span>
      {total > 0 && <span className={cx(styles.summaryPct, 'tabular')}>{formatPercent((value / total) * 100)}</span>}
    </div>
  )
}

/** Lista de estudiantes de una fecha con corrección rápida y acciones masivas (RF-07). */
export default function ByDateView({ clase, search, onEdit }) {
  const { session, adminEmail } = useAuth()
  const toast = useToast()
  const client = useApolloClient()
  const [statusFilter, setStatusFilter] = useState('todos')
  const [saving, setSaving] = useState(() => new Set())
  const [selected, setSelected] = useState(() => new Set())
  const [bulk, setBulk] = useState(null)

  const { data, error, refetch } = useQuery(ASISTENCIAS_POR_CLASE, {
    variables: { claseId: Number(clase.id) },
    pollInterval: clase.timing === 'hoy' ? 20_000 : 0,
    notifyOnNetworkStatusChange: false,
  })
  const [modificar] = useMutation(MODIFICAR_ASISTENCIA)

  const rows = useMemo(
    () =>
      [...(data?.asistenciasPorClase ?? [])]
        .map((record) => ({
          ...record,
          status: resolveStatus(record.estado, clase.timing, { explicit: Boolean(record.modificadoPor) }),
        }))
        .sort(byName),
    [data, clase.timing],
  )

  const summary = useMemo(() => summarize(rows.map((row) => row.status)), [rows])
  const term = normalizeText(search)
  const visible = rows.filter(
    (row) =>
      (statusFilter === 'todos' || row.status === statusFilter) &&
      (!term ||
        normalizeText(`${row.estudiante.nombreCompleto} ${row.estudiante.nroRegistro} ${row.estudiante.email}`).includes(term)),
  )

  const pendingKey = clase.timing === 'futura' ? 'programada' : 'pendiente'
  const filterOptions = [
    { value: 'todos', label: 'Todos', count: rows.length },
    { value: 'presente', label: 'Presentes', count: summary.presente },
    { value: 'falta', label: 'Faltas', count: summary.falta },
    { value: 'justificado', label: 'Justificados', count: summary.justificado },
  ]
  if (clase.timing !== 'pasada') {
    filterOptions.push({ value: pendingKey, label: STATUS[pendingKey].label, count: summary[pendingKey] })
  }

  const visibleIds = visible.map((row) => row.estudiante.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  const toggleOne = (id) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected((current) => {
      const next = new Set(current)
      if (allSelected) visibleIds.forEach((id) => next.delete(id))
      else visibleIds.forEach((id) => next.add(id))
      return next
    })

  const markSaving = (id, on) =>
    setSaving((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  /** Cambio individual con respuesta optimista: la fila se actualiza al instante. */
  const changeStatus = async (row, estado) => {
    markSaving(row.id, true)
    try {
      const { data: response } = await modificar({
        variables: {
          claseId: Number(clase.id),
          estudianteId: Number(row.estudiante.id),
          nuevoEstado: estado,
          adminEmail,
        },
        optimisticResponse: {
          modificarAsistenciaAdmin: {
            __typename: 'ModificarAsistenciaAdmin',
            success: true,
            message: '',
            asistencia: {
              __typename: 'AsistenciaType',
              id: row.id,
              estado,
              observacion: row.observacion,
              fechaHoraMarca: row.fechaHoraMarca,
              horaMarcaFormateada: row.horaMarcaFormateada,
              fechaModificacion: row.fechaModificacion,
              modificadoPor: { __typename: 'UsuarioType', id: session?.usuario?.id ?? '0', email: adminEmail ?? '' },
            },
          },
        },
        refetchQueries: ['ReporteGeneral', 'ClasesModulo', 'HistorialActividades'],
      })
      const result = response?.modificarAsistenciaAdmin
      if (result?.success) {
        toast.success(`${row.estudiante.nombreCompleto}: ${ESTADO_LABEL[estado]}`, { title: 'Asistencia actualizada' })
      } else {
        toast.error(result?.message ?? 'No se pudo actualizar la asistencia.')
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      markSaving(row.id, false)
    }
  }

  /** Acción masiva: un cambio auditado por estudiante (valores anterior y nuevo, RN-07). */
  const applyBulk = async (estado) => {
    const targets = rows.filter((row) => selected.has(row.estudiante.id))
    if (!targets.length) return
    setBulk({ done: 0, total: targets.length, estado })
    const results = await runPool(
      targets,
      async (row) => {
        const { data: response } = await modificar({
          variables: { claseId: Number(clase.id), estudianteId: Number(row.estudiante.id), nuevoEstado: estado, adminEmail },
        })
        if (!response?.modificarAsistenciaAdmin?.success) throw new Error(response?.modificarAsistenciaAdmin?.message)
      },
      { limit: 4, onProgress: (done, total) => setBulk({ done, total, estado }) },
    )
    await client.refetchQueries({ include: ATTENDANCE_REFETCH })
    const failed = results.filter((result) => !result.ok).length
    const ok = results.length - failed
    if (failed === 0) {
      toast.success(`${ok} ${ok === 1 ? 'asistencia actualizada' : 'asistencias actualizadas'} a ${ESTADO_LABEL[estado]}.`, {
        title: 'Cambio masivo aplicado',
      })
    } else {
      toast.warning(`${ok} actualizadas y ${failed} con error. Revisa la conexión e inténtalo de nuevo.`)
    }
    setBulk(null)
    setSelected(new Set())
  }

  const total = rows.length

  return (
    <>
      <div className={styles.dateSummary}>
        <div className={cx('glass', styles.classInfo)}>
          <span className={styles.classInfoLabel}>{clase.label}</span>
          <strong className={styles.classInfoDate}>{capitalize(formatDateLong(clase.fechaProgramada))}</strong>
          <span className={styles.classInfoMeta}>
            <Clock3 size={14} aria-hidden="true" /> {formatTimeRange(clase.horaInicio, clase.horaFin)}
            {clase.timing === 'hoy' && <Tag tone="ok" size="sm">En curso</Tag>}
            {clase.timing === 'futura' && <Tag tone="neutral" size="sm">Programada</Tag>}
          </span>
          {total > 0 && <ProgressBar value={summary.presente} max={total} tone="ok" size="sm" label="Presentes" />}
        </div>
        <div className={styles.summaryGrid}>
          <SummaryPill tone="ok" icon={CircleCheck} label="Presentes" value={summary.presente} total={total} />
          <SummaryPill tone="bad" icon={CircleX} label="Faltas" value={summary.falta} total={total} />
          <SummaryPill tone="warn" icon={ShieldCheck} label="Justificados" value={summary.justificado} total={total} />
          <SummaryPill
            tone={clase.timing === 'futura' ? 'neutral' : 'info'}
            icon={STATUS[pendingKey].icon}
            label={STATUS[pendingKey].label}
            value={summary[pendingKey]}
            total={total}
          />
        </div>
      </div>

      <Card padding="none" className="anim-fade-up" style={{ '--i': 2 }}>
        <div className={styles.tableToolbar}>
          <SegmentedControl
            ariaLabel="Filtrar por estado"
            size="sm"
            value={statusFilter}
            onChange={setStatusFilter}
            options={filterOptions}
          />
          <span className={styles.countLabel}>
            <UsersRound size={14} aria-hidden="true" /> {visible.length} de {total} estudiantes
          </span>
        </div>

        {error && !data ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !data ? (
          <div className={styles.tablePad}>
            <SkeletonRows rows={6} height={58} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            tone="neutral"
            title={total === 0 ? 'No hay estudiantes inscritos' : 'Ningún estudiante coincide'}
            description={total === 0 ? 'Importa la lista de estudiantes del módulo.' : 'Cambia la búsqueda o el filtro de estado.'}
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkCol}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Seleccionar todos los visibles"
                    />
                  </th>
                  <th scope="col">Estudiante</th>
                  <th scope="col">Nº registro</th>
                  <th scope="col">Hora de marca</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Observación</th>
                  <th scope="col" className={styles.actionsCol}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => {
                  const student = row.estudiante
                  const isSelected = selected.has(student.id)
                  return (
                    <tr
                      key={row.id}
                      className={cx(styles.row, isSelected && styles.rowSelected, 'anim-fade-in')}
                      style={{ '--i': Math.min(index, 12) }}
                    >
                      <td className={styles.checkCol}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => toggleOne(student.id)}
                          aria-label={`Seleccionar a ${student.nombreCompleto}`}
                        />
                      </td>
                      <td className={styles.studentCell}>
                        <Avatar name={student.nombreCompleto} size={36} />
                        <span className={styles.studentText}>
                          <strong className="truncate">{student.nombreCompleto}</strong>
                          <span className="truncate">{student.email}</span>
                        </span>
                      </td>
                      <td className={cx(styles.mutedCell, 'mono')} data-label="Registro">
                        {student.nroRegistro}
                      </td>
                      <td className={cx(styles.timeCell, 'tabular')} data-label="Marca">
                        {row.status === 'presente' && row.fechaHoraMarca ? formatDateTime(row.fechaHoraMarca, TIME_FORMAT) : '—'}
                      </td>
                      <td className={styles.statusCell}>
                        <StatusPicker
                          status={row.status}
                          busy={saving.has(row.id)}
                          disabled={Boolean(bulk)}
                          label={`Estado de ${student.nombreCompleto}`}
                          onChange={(estado) => changeStatus(row, estado)}
                        />
                      </td>
                      <td className={styles.noteCell} data-label="Observación">
                        <span className={cx(styles.note, !row.observacion && styles.noteEmpty)} title={row.observacion || undefined}>
                          {row.observacion || 'Sin observación'}
                        </span>
                        {row.modificadoPor && (
                          <span className={styles.modifiedBy}>
                            Editado por {row.modificadoPor.email} · {formatDateTime(row.fechaModificacion)}
                          </span>
                        )}
                      </td>
                      <td className={styles.actionsCol}>
                        <button
                          type="button"
                          className={styles.rowAction}
                          onClick={() =>
                            onEdit({
                              student,
                              clase,
                              status: row.status,
                              observacion: row.observacion,
                              hora:
                                row.status === 'presente' && row.fechaHoraMarca
                                  ? formatDateTime(row.fechaHoraMarca, TIME_FORMAT)
                                  : null,
                            })
                          }
                          aria-label={`Editar asistencia de ${student.nombreCompleto}`}
                          title="Editar con observación"
                        >
                          <PenLine size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(selected.size > 0 || bulk) && (
        <div className={cx('glass-strong', styles.bulkBar)} role="toolbar" aria-label="Acciones masivas">
          <span className={styles.bulkCount}>
            {bulk ? (
              <>
                Actualizando <strong className="tabular">{bulk.done}</strong>/{bulk.total}…
              </>
            ) : (
              <>
                <strong className="tabular">{selected.size}</strong> {selected.size === 1 ? 'seleccionado' : 'seleccionados'}
              </>
            )}
          </span>
          <div className={styles.bulkActions}>
            {EDITABLE_STATES.map((option) => {
              const Icon = BULK_ICONS[option.value]
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant="secondary"
                  icon={Icon}
                  className={styles[`bulk-${option.tone}`]}
                  loading={bulk?.estado === option.value}
                  disabled={Boolean(bulk)}
                  onClick={() => applyBulk(option.value)}
                >
                  {option.label}
                </Button>
              )
            })}
            <Button size="sm" variant="ghost" icon={X} disabled={Boolean(bulk)} onClick={() => setSelected(new Set())} aria-label="Limpiar selección" />
          </div>
        </div>
      )}
    </>
  )
}
