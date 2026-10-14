import styles from './Schedule.module.css'
import { formatDateLong, formatTime, monthGrid } from '../../../lib/dates'
import { cx } from '../../../lib/cx'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Calendario mensual con los días de clase resaltados según su estado. */
export default function MonthCalendar({ month, classesByDate, today, onSelectDay }) {
  const cells = monthGrid(month)
  return (
    <div className={styles.calendar}>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={styles.days} key={month}>
        {cells.map((cell, index) => {
          const clase = classesByDate.get(cell.iso)
          const isToday = cell.iso === today
          return (
            <button
              key={cell.iso}
              type="button"
              className={cx(
                styles.day,
                !cell.inMonth && styles.outside,
                isToday && styles.isToday,
                clase && styles.hasClass,
                clase && styles[`timing-${clase.timing}`],
              )}
              style={{ '--i': index }}
              onClick={() => onSelectDay(cell.iso, clase)}
              aria-label={`${formatDateLong(cell.iso)}${clase ? `: ${clase.label}` : ': sin clase, programar'}`}
            >
              <span className={styles.dayNumber}>{cell.day}</span>
              {clase && (
                <span className={styles.dayBadge}>
                  {clase.rate != null ? `${Math.round(clase.rate)}%` : formatTime(clase.horaInicio) || 'Clase'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
