import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { CalendarDays, Download, FileSpreadsheet, Grid3x3, Rocket } from 'lucide-react'
import styles from './Attendance.module.css'
import DateStrip from './DateStrip'
import ByDateView from './ByDateView'
import MatrixView from './MatrixView'
import EditAttendanceModal from './EditAttendanceModal'
import { useAttendanceModel } from '../useAttendanceModel'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import LinkButton from '../../../components/ui/LinkButton'
import SearchInput from '../../../components/ui/SearchInput'
import SegmentedControl from '../../../components/ui/SegmentedControl'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Skeleton, { SkeletonRows } from '../../../components/ui/Skeleton'
import { useToast } from '../../../context/toast-context'
import { exportAttendanceWorkbook } from '../../../lib/excel'
import { getErrorMessage } from '../../../lib/errors'
import { cx } from '../../../lib/cx'

function defaultClassId(classes) {
  const today = classes.find((clase) => clase.timing === 'hoy')
  const lastPast = classes.findLast((clase) => clase.timing === 'pasada')
  return (today ?? lastPast ?? classes[0])?.id
}

export default function AttendancePage() {
  const toast = useToast()
  const { modulo, model, today, ready, error, refetch } = useAttendanceModel()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(() => params.get('buscar') ?? '')
  const [editing, setEditing] = useState(null)
  const [exporting, setExporting] = useState(false)

  const view = params.get('vista') === 'general' ? 'general' : 'fecha'
  const classes = model.classes
  const requested = params.get('clase')
  const selectedId = classes.some((clase) => clase.id === requested) ? requested : defaultClassId(classes)
  const selectedClass = classes.find((clase) => clase.id === selectedId)

  const updateParams = (patch) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(patch)) {
          if (value == null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )

  const handleExport = async () => {
    setExporting(true)
    try {
      const fileName = await exportAttendanceWorkbook({ modulo, model, todayISO: today })
      toast.success(`Se descargó ${fileName}`, { title: 'Reporte exportado' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo generar el archivo Excel.'))
    } finally {
      setExporting(false)
    }
  }

  const header = (
    <PageHeader
      eyebrow="Gestión de asistencia"
      title="Asistencias"
      description="Consulta y corrige la asistencia de cualquier fecha del módulo activo. Cada cambio queda auditado."
      actions={
        <Button variant="secondary" icon={Download} onClick={handleExport} loading={exporting} disabled={!ready || !modulo}>
          Exportar a Excel
        </Button>
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
            description="Activa un módulo para registrar y consultar asistencias."
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

      <div className={cx('glass', styles.toolbar)}>
        <SegmentedControl
          ariaLabel="Vista de asistencias"
          value={view}
          onChange={(value) => updateParams({ vista: value === 'general' ? 'general' : null })}
          options={[
            { value: 'fecha', label: 'Por fecha', icon: CalendarDays },
            { value: 'general', label: 'Vista general', icon: Grid3x3 },
          ]}
        />
        <SearchInput
          className={styles.search}
          value={search}
          onChange={setSearch}
          placeholder="Buscar estudiante por nombre, registro o correo…"
          label="Buscar estudiante"
        />
      </div>

      {!ready ? (
        <>
          <Skeleton height={92} radius={20} />
          <SkeletonRows rows={6} height={60} />
        </>
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            tone="neutral"
            title="El módulo no tiene fechas de clase"
            description="Importa el calendario o programa clases manualmente para empezar."
            action={
              <LinkButton to="/admin/calendario" variant="secondary" icon={CalendarDays}>
                Ir al calendario
              </LinkButton>
            }
          />
        </Card>
      ) : view === 'fecha' ? (
        <>
          <DateStrip classes={classes} selectedId={selectedId} onSelect={(id) => updateParams({ clase: id })} />
          {selectedClass && <ByDateView key={selectedClass.id} clase={selectedClass} search={search} onEdit={setEditing} />}
        </>
      ) : (
        <MatrixView model={model} search={search} onEdit={setEditing} />
      )}

      {editing && <EditAttendanceModal target={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
