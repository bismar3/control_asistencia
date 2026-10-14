import { useEffect, useRef } from 'react'
import styles from './Attendance.module.css'
import { formatDateLong, formatMonthShort, formatWeekday, parseISODate } from '../../../lib/dates'
import { cx } from '../../../lib/cx'

/** Carrusel horizontal de fechas de clase (filtro por fecha, RF-08). */
export default function DateStrip({ classes, selectedId, onSelect }) {
  const selectedRef = useRef(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <div className={styles.strip} role="listbox" aria-label="Fecha de clase" aria-orientation="horizontal">
      {classes.map((clase, index) => {
        const selected = clase.id === selectedId
        return (
          <button
            key={clase.id}
            ref={selected ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={selected}
            title={`${clase.label} · ${formatDateLong(clase.fechaProgramada)}`}
            className={cx(styles.dateChip, styles[`timing-${clase.timing}`], selected && styles.dateChipActive)}
            onClick={() => onSelect(clase.id)}
            style={{ '--i': Math.min(index, 14) }}
          >
            <span className={styles.chipWeek}>{formatWeekday(clase.fechaProgramada)}</span>
            <strong className={styles.chipDay}>{parseISODate(clase.fechaProgramada).getDate()}</strong>
            <span className={styles.chipMonth}>{formatMonthShort(clase.fechaProgramada)}</span>
            <span className={styles.chipRate}>
              {clase.timing === 'hoy' ? 'Hoy' : clase.rate == null ? '—' : `${Math.round(clase.rate)}%`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
