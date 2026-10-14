import { useState } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'
import styles from './AttendanceColumns.module.css'
import SegmentedControl from '../ui/SegmentedControl'
import { formatDateLong, formatDateShort, formatMonthShort, parseISODate } from '../../lib/dates'
import { capitalize, formatPercent } from '../../lib/format'
import { cx } from '../../lib/cx'

const TICKS = [100, 75, 50, 25, 0]

function Tooltip({ clase, index, count, totalStudents }) {
  // Se ubica al costado de la columna (hacia la mitad con más espacio) para no recortarse.
  const side = index < count / 2 ? 'right' : 'left'
  const { summary } = clase
  const rows = [
    { key: 'ok', label: 'Presentes', value: summary.presente },
    { key: 'warn', label: 'Justificados', value: summary.justificado },
    { key: 'bad', label: 'Faltas', value: summary.falta },
  ]
  if (clase.timing === 'hoy') rows.push({ key: 'info', label: 'Sin marcar', value: summary.pendiente })

  return (
    <div className={cx(styles.tooltip, styles[`side-${side}`])} style={{ '--idx': index }} role="status">
      <p className={styles.tooltipDate}>{capitalize(formatDateLong(clase.fechaProgramada))}</p>
      {clase.rate == null ? (
        <p className={styles.tooltipValue}>Programada</p>
      ) : (
        <p className={styles.tooltipValue}>
          {formatPercent(clase.rate, 0)} <span>asistencia</span>
        </p>
      )}
      <p className={styles.tooltipLabel}>
        {clase.label} · {totalStudents} inscritos
      </p>
      {clase.rate != null && (
        <ul className={styles.tooltipRows}>
          {rows.map((row) => (
            <li key={row.key}>
              <i className={cx(styles.key, styles[row.key])} />
              <strong className="tabular">{row.value}</strong>
              <span>{row.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Columnas: porcentaje de presentes por fecha de clase (una sola serie → sin leyenda de serie).
 * Incluye tooltip por columna (hover y foco de teclado) y una vista de tabla equivalente.
 */
export default function AttendanceColumns({ classes, totalStudents, height = 230 }) {
  const [active, setActive] = useState(null)
  const [view, setView] = useState('chart')
  const count = classes.length
  const lastEvaluated = classes.findLastIndex((clase) => clase.rate != null)

  return (
    <div className={styles.chart}>
      <div className={styles.toolbar}>
        <ul className={styles.legend} aria-hidden={view === 'table'}>
          <li>
            <i className={cx(styles.key, styles.keyBar)} /> Clase dictada
          </li>
          <li>
            <i className={cx(styles.key, styles.keyToday)} /> Hoy
          </li>
          <li>
            <i className={cx(styles.key, styles.keyFuture)} /> Programada
          </li>
        </ul>
        <SegmentedControl
          size="sm"
          ariaLabel="Vista del gráfico"
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: 'Gráfico', icon: ChartColumn },
            { value: 'table', label: 'Tabla', icon: Table2 },
          ]}
        />
      </div>

      {view === 'chart' ? (
        <div className={styles.scroller}>
          <div className={styles.frame} style={{ '--n': count, '--plot-h': `${height}px` }}>
            <div className={styles.yAxis} aria-hidden="true">
              {TICKS.map((tick) => (
                <span key={tick} style={{ '--y': tick }}>
                  {tick}%
                </span>
              ))}
            </div>

            <div className={styles.area} onPointerLeave={() => setActive(null)}>
              {TICKS.map((tick) => (
                <span key={tick} className={cx(styles.gridline, tick === 0 && styles.baseline)} style={{ '--y': tick }} />
              ))}

              <div className={styles.columns}>
                {classes.map((clase, index) => (
                  <button
                    key={clase.id}
                    type="button"
                    className={cx(styles.col, styles[clase.timing], active === index && styles.active)}
                    style={{ '--h': clase.rate ?? 0, '--i': index }}
                    onPointerEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    aria-label={`${formatDateLong(clase.fechaProgramada)}: ${
                      clase.rate == null ? 'clase programada' : `${formatPercent(clase.rate)} de asistencia`
                    }`}
                  >
                    {clase.rate == null ? <span className={styles.stub} /> : <span className={styles.bar} />}
                    {(index === lastEvaluated || clase.timing === 'hoy') && clase.rate != null && (
                      <span className={styles.valueLabel}>
                        {clase.timing === 'hoy' ? 'Hoy · ' : ''}
                        {formatPercent(clase.rate)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {active != null && classes[active] && (
                <Tooltip clase={classes[active]} index={active} count={count} totalStudents={totalStudents} />
              )}
            </div>

            <div className={styles.xAxis} aria-hidden="true">
              {classes.map((clase, index) => {
                const date = parseISODate(clase.fechaProgramada)
                const newMonth = index === 0 || classes[index - 1].fechaProgramada.slice(0, 7) !== clase.fechaProgramada.slice(0, 7)
                return (
                  <span key={clase.id} className={cx(styles.xLabel, clase.timing === 'hoy' && styles.xToday)}>
                    <strong>{date.getDate()}</strong>
                    {newMonth && <em>{formatMonthShort(clase.fechaProgramada)}</em>}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Clase</th>
                <th scope="col">Fecha</th>
                <th scope="col">Presentes</th>
                <th scope="col">Justificados</th>
                <th scope="col">Faltas</th>
                <th scope="col">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((clase) => (
                <tr key={clase.id}>
                  <th scope="row">{clase.label}</th>
                  <td>{formatDateShort(clase.fechaProgramada)}</td>
                  <td className="tabular">{clase.rate == null ? '—' : clase.summary.presente}</td>
                  <td className="tabular">{clase.rate == null ? '—' : clase.summary.justificado}</td>
                  <td className="tabular">{clase.rate == null ? '—' : clase.summary.falta}</td>
                  <td className="tabular">{clase.rate == null ? 'Programada' : formatPercent(clase.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
