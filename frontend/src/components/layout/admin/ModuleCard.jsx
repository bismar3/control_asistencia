import { Link } from 'react-router'
import { CalendarCheck, Plus } from 'lucide-react'
import styles from './AdminLayout.module.css'
import ProgressBar from '../../ui/ProgressBar'
import LiveDot from '../../ui/LiveDot'
import Skeleton from '../../ui/Skeleton'
import { formatDate, formatTimeRange } from '../../../lib/dates'

/** Resumen del módulo activo en la barra lateral (RN-01: un solo módulo activo). */
export default function ModuleCard({ modulo, classes, loading, onNavigate }) {
  if (loading && !modulo) {
    return (
      <div className={styles.moduleCard}>
        <Skeleton width="45%" height={12} />
        <Skeleton width="90%" height={18} style={{ marginTop: 10 }} />
        <Skeleton width="100%" height={8} style={{ marginTop: 14 }} />
      </div>
    )
  }

  if (!modulo) {
    return (
      <Link to="/admin/importar" className={`${styles.moduleCard} ${styles.moduleEmpty}`} onClick={onNavigate}>
        <span className={styles.moduleLabel}>Sin módulo activo</span>
        <span className={styles.moduleEmptyAction}>
          <Plus size={15} /> Activar un módulo
        </span>
      </Link>
    )
  }

  const total = classes.length
  const done = classes.filter((clase) => clase.timing !== 'futura').length
  const today = classes.find((clase) => clase.timing === 'hoy')
  const first = classes[0]?.fechaProgramada ?? modulo.fechaInicio
  const last = classes.at(-1)?.fechaProgramada ?? modulo.fechaFin

  return (
    <div className={styles.moduleCard}>
      <span className={styles.moduleLabel}>
        <LiveDot tone="ok" /> Módulo activo
      </span>
      <strong className={styles.moduleName} title={modulo.nombre}>
        {modulo.nombre}
      </strong>
      {first && (
        <span className={styles.moduleDates}>
          {formatDate(first, { day: 'numeric', month: 'short' })} – {formatDate(last, { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )}
      <div className={styles.moduleProgress}>
        <ProgressBar value={done} max={Math.max(total, 1)} size="sm" label="Avance del módulo" />
        <span className="tabular">
          {done}/{total}
        </span>
      </div>
      {today && (
        <Link to="/admin/asistencias" className={styles.todayChip} onClick={onNavigate}>
          <CalendarCheck size={14} />
          <span>
            {today.label} hoy · {formatTimeRange(today.horaInicio, today.horaFin)}
          </span>
        </Link>
      )}
    </div>
  )
}
