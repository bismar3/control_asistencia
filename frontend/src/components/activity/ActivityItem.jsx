import { useState } from 'react'
import { ArrowRight, ChevronDown, Clock3, Target, UserRound } from 'lucide-react'
import styles from './ActivityItem.module.css'
import StatusBadge from '../ui/StatusBadge'
import { actionMeta } from '../../lib/activity'
import { parseJSON } from '../../lib/attendance'
import { formatDateTime } from '../../lib/dates'
import { cx } from '../../lib/cx'

const ESTADO_TO_STATUS = { PRESENTE: 'presente', FALTA: 'falta', JUSTIFICADO: 'justificado' }

function ValuePill({ value }) {
  const status = ESTADO_TO_STATUS[value?.trim?.().toUpperCase()]
  if (status) return <StatusBadge status={status} size="sm" />
  return <span className={styles.pill}>{value}</span>
}

const DETAIL_LABELS = {
  hora_marca: 'Hora de marca',
  fecha: 'Fecha',
  observacion: 'Observación',
  archivo: 'Archivo',
  total: 'Total',
  total_clases: 'Total de clases',
}

/** Entrada del historial de actividad con valores anterior → nuevo (RF-07, RF-09). */
export default function ActivityItem({ activity, compact = false, index = 0 }) {
  const [open, setOpen] = useState(false)
  const meta = actionMeta(activity.accion)
  const Icon = meta.icon
  const details = Object.entries(parseJSON(activity.detalles, {})).filter(([, value]) => value !== null && value !== '')
  const hasChange = activity.valorAnterior || activity.valorNuevo

  return (
    <li className={cx(styles.item, compact && styles.compact, 'anim-fade-up')} style={{ '--i': Math.min(index, 12) }}>
      <span className={cx(styles.icon, styles[meta.tone])} aria-hidden="true">
        <Icon size={compact ? 15 : 17} strokeWidth={2.3} />
      </span>
      <div className={styles.body}>
        <div className={styles.headline}>
          <p className={styles.description}>{activity.descripcion || meta.label}</p>
          <time className={styles.time} dateTime={activity.fechaHora}>
            <Clock3 size={12} aria-hidden="true" />
            {formatDateTime(activity.fechaHora, compact ? { hour: '2-digit', minute: '2-digit' } : undefined)}
          </time>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <UserRound size={12} aria-hidden="true" /> {activity.usuarioEmail || 'Sistema'}
          </span>
          {!compact && <span className={cx(styles.type, styles[meta.tone])}>{meta.label}</span>}
          {activity.registroAfectado && (
            <span className={cx(styles.metaItem, styles.record)} title={activity.registroAfectado}>
              <Target size={12} aria-hidden="true" /> {activity.registroAfectado}
            </span>
          )}
        </div>

        {hasChange && (
          <div className={styles.change}>
            {activity.valorAnterior && <ValuePill value={activity.valorAnterior} />}
            {activity.valorAnterior && activity.valorNuevo && <ArrowRight size={14} className={styles.arrow} aria-hidden="true" />}
            {activity.valorNuevo && <ValuePill value={activity.valorNuevo} />}
          </div>
        )}

        {!compact && details.length > 0 && (
          <>
            <button type="button" className={styles.toggle} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
              Detalles <ChevronDown size={14} className={cx(styles.chevron, open && styles.chevronOpen)} />
            </button>
            {open && (
              <dl className={styles.details}>
                {details.map(([key, value]) => (
                  <div key={key}>
                    <dt>{DETAIL_LABELS[key] ?? key}</dt>
                    <dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}
      </div>
    </li>
  )
}
