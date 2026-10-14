import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  ArrowDownUp,
  ChartPie,
  Eye,
  FileSpreadsheet,
  Pencil,
  Rocket,
  TriangleAlert,
  UserMinus,
  UserPlus,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react'
import styles from './Students.module.css'
import StudentFormModal from './StudentFormModal'
import StudentDrawer from './StudentDrawer'
import { useAttendanceModel } from '../useAttendanceModel'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import LinkButton from '../../../components/ui/LinkButton'
import SearchInput from '../../../components/ui/SearchInput'
import StatTile from '../../../components/ui/StatTile'
import Avatar from '../../../components/ui/Avatar'
import ProgressBar from '../../../components/ui/ProgressBar'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Field from '../../../components/ui/Field'
import { SkeletonRows } from '../../../components/ui/Skeleton'
import { useToast } from '../../../context/toast-context'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { DESINSCRIBIR_ESTUDIANTE, ESTUDIANTES_MODULO_ACTIVO } from '../../../graphql/estudiantes'
import { STUDENTS_REFETCH } from '../../../graphql/refetch'
import { ATTENDANCE_WARNING } from '../../../config'
import { severityOf } from '../../../lib/attendance'
import { getErrorMessage } from '../../../lib/errors'
import { formatPercent } from '../../../lib/format'
import { cx } from '../../../lib/cx'

const SORTS = {
  apellido: (a, b) =>
    (a.apellidoPaterno || a.nombre).localeCompare(b.apellidoPaterno || b.nombre, 'es') || a.nombre.localeCompare(b.nombre, 'es'),
  registro: (a, b) => a.nroRegistro.localeCompare(b.nroRegistro, 'es', { numeric: true }),
  menor: (a, b) => (a.summary?.porcentaje ?? 101) - (b.summary?.porcentaje ?? 101),
  mayor: (a, b) => (b.summary?.porcentaje ?? -1) - (a.summary?.porcentaje ?? -1),
}

export default function StudentsPage() {
  const toast = useToast()
  const [params] = useSearchParams()
  const [search, setSearch] = useState(() => params.get('buscar') ?? '')
  const [sort, setSort] = useState('apellido')
  const [form, setForm] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [removing, setRemoving] = useState(null)
  const busqueda = useDebouncedValue(search.trim(), 300)

  const { modulo, model, ready, error: modelError, refetch: refetchModel } = useAttendanceModel()
  const { data, previousData, error, refetch } = useQuery(ESTUDIANTES_MODULO_ACTIVO, {
    variables: { busqueda: busqueda || null },
    skip: ready && !modulo,
  })
  const [desinscribir] = useMutation(DESINSCRIBIR_ESTUDIANTE)

  const statsById = useMemo(() => new Map(model.students.map((student) => [student.id, student])), [model.students])
  const list = (data ?? previousData)?.estudiantesModuloActivo
  const rows = useMemo(
    () =>
      (list ?? [])
        .map((student) => {
          const stats = statsById.get(String(student.id))
          return { ...student, id: String(student.id), summary: stats?.summary, cells: stats?.cells }
        })
        .sort(SORTS[sort]),
    [list, statsById, sort],
  )

  const evaluated = model.students.filter((student) => student.summary.evaluadas > 0)
  const average = evaluated.length
    ? evaluated.reduce((sum, student) => sum + student.summary.porcentaje, 0) / evaluated.length
    : null
  const atRisk = evaluated.filter((student) => student.summary.porcentaje < ATTENDANCE_WARNING).length
  const perfect = evaluated.filter((student) => student.summary.falta === 0).length

  const detailStudent = detailId ? model.students.find((student) => student.id === detailId) : null

  const handleRemove = async () => {
    try {
      const { data: response } = await desinscribir({
        variables: { moduloId: Number(modulo.id), estudianteId: Number(removing.id) },
        refetchQueries: STUDENTS_REFETCH,
        awaitRefetchQueries: true,
      })
      const result = response?.desinscribirEstudiante
      if (!result?.success) {
        toast.error(result?.message ?? 'No se pudo quitar al estudiante.')
        return false
      }
      toast.success(`${removing.nombreCompleto} ya no figura en el módulo activo. Sus registros se conservan.`, {
        title: 'Estudiante retirado',
      })
      setDetailId(null)
      return true
    } catch (err) {
      toast.error(getErrorMessage(err))
      return false
    }
  }

  const header = (
    <PageHeader
      eyebrow="Módulo activo"
      title="Estudiantes"
      description="Lista completa de estudiantes inscritos. Busca por nombre o número de registro."
      actions={
        modulo && (
          <>
            <LinkButton to="/admin/importar?modo=actualizar" variant="secondary" icon={FileSpreadsheet}>
              Importar Excel
            </LinkButton>
            <Button icon={UserPlus} onClick={() => setForm({ student: null })}>
              Agregar estudiante
            </Button>
          </>
        )
      }
    />
  )

  if ((modelError || error) && !list && !ready) {
    return (
      <>
        {header}
        <Card>
          <ErrorState
            error={modelError ?? error}
            onRetry={() => {
              refetchModel()
              refetch()
            }}
          />
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
            description="Importa la lista de estudiantes al activar un nuevo módulo."
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
        <StatTile label="Inscritos" value={model.totalStudents} icon={UsersRound} loading={!ready} index={0} hint="En el módulo activo" />
        <StatTile
          label="Asistencia promedio"
          value={average ?? undefined}
          suffix="%"
          icon={ChartPie}
          tone={severityOf(average) === 'neutral' ? 'accent' : severityOf(average)}
          loading={!ready}
          index={1}
          hint="Promedio por estudiante"
        />
        <StatTile label="En riesgo" value={atRisk} icon={TriangleAlert} tone="bad" loading={!ready} index={2} hint={`Menos de ${ATTENDANCE_WARNING}% de asistencia`} />
        <StatTile label="Sin faltas" value={perfect} icon={UserRoundSearch} tone="ok" loading={!ready} index={3} hint="Asistencia perfecta hasta hoy" />
      </div>

      <Card padding="none" className="anim-fade-up" style={{ '--i': 4 }}>
        <div className={styles.toolbar}>
          <SearchInput
            className={styles.search}
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o número de registro…"
            label="Buscar estudiante"
          />
          <Field as="select" icon={ArrowDownUp} value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar" className={styles.sort}>
            <option value="apellido">Ordenar por apellido</option>
            <option value="registro">Ordenar por Nº de registro</option>
            <option value="menor">Menor asistencia primero</option>
            <option value="mayor">Mayor asistencia primero</option>
          </Field>
        </div>

        {!list ? (
          <div className={styles.pad}>
            <SkeletonRows rows={6} height={62} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UserRoundSearch}
            tone="neutral"
            title={busqueda ? 'Sin coincidencias' : 'Aún no hay estudiantes'}
            description={
              busqueda ? `No encontramos estudiantes para “${busqueda}”.` : 'Agrega estudiantes manualmente o impórtalos desde Excel.'
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Estudiante</th>
                  <th scope="col">Nº registro</th>
                  <th scope="col">Correo electrónico</th>
                  <th scope="col">Asistencia</th>
                  <th scope="col" className={styles.center}>
                    Faltas
                  </th>
                  <th scope="col" className={styles.actionsHead}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((student, index) => {
                  const pct = student.summary?.porcentaje ?? null
                  const severity = severityOf(pct)
                  return (
                    <tr key={student.id} className={cx(styles.row, 'anim-fade-in')} style={{ '--i': Math.min(index, 12) }}>
                      <td>
                        <button type="button" className={styles.studentButton} onClick={() => setDetailId(student.id)}>
                          <Avatar name={student.nombreCompleto} size={38} />
                          <span className={styles.studentText}>
                            <strong className="truncate">{student.nombreCompleto}</strong>
                            <span className="truncate">{student.celular ? `Cel. ${student.celular}` : 'Sin celular'}</span>
                          </span>
                        </button>
                      </td>
                      <td className="mono" data-label="Registro">
                        {student.nroRegistro}
                      </td>
                      <td className={styles.email} data-label="Correo">
                        {student.email}
                      </td>
                      <td className={styles.attendanceCell}>
                        {pct == null ? (
                          <span className={styles.muted}>Sin evaluar</span>
                        ) : (
                          <span className={styles.meter}>
                            <ProgressBar value={pct} tone={severity} size="sm" label={`Asistencia de ${student.nombreCompleto}`} />
                            <strong className={cx('tabular', styles[`text-${severity}`])}>{formatPercent(pct)}</strong>
                          </span>
                        )}
                      </td>
                      <td className={cx(styles.center, 'tabular')} data-label="Faltas">
                        {student.summary?.falta ?? '—'}
                      </td>
                      <td className={styles.actions}>
                        <button type="button" className={styles.iconAction} onClick={() => setDetailId(student.id)} aria-label={`Ver ficha de ${student.nombreCompleto}`} title="Ver ficha">
                          <Eye size={16} />
                        </button>
                        <button type="button" className={styles.iconAction} onClick={() => setForm({ student })} aria-label={`Editar a ${student.nombreCompleto}`} title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className={cx(styles.iconAction, styles.iconDanger)}
                          onClick={() => setRemoving(student)}
                          aria-label={`Quitar a ${student.nombreCompleto} del módulo`}
                          title="Quitar del módulo"
                        >
                          <UserMinus size={16} />
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

      {form && <StudentFormModal student={form.student} moduloId={modulo?.id} onClose={() => setForm(null)} />}

      {detailStudent && (
        <StudentDrawer
          student={detailStudent}
          classes={model.classes}
          onClose={() => setDetailId(null)}
          onEdit={(student) => setForm({ student })}
          onRemove={(student) => setRemoving(student)}
        />
      )}

      {removing && (
        <ConfirmDialog
          title="Quitar del módulo activo"
          description={removing.nombreCompleto}
          icon={UserMinus}
          confirmLabel="Quitar estudiante"
          onConfirm={handleRemove}
          onClose={() => setRemoving(null)}
        >
          <p>
            El estudiante dejará de figurar en la lista del módulo y no podrá ingresar al sistema. Sus registros de asistencia se conservan
            en la base de datos.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
