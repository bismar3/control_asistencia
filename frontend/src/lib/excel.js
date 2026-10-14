import { formatDateLong, formatDateShort, formatDayMonth, formatTimeRange } from './dates'
import { STATUS } from './attendance'
import { slugify } from './format'

/* La librería se carga solo cuando el usuario exporta o descarga una plantilla (code splitting). */
async function loadWriter() {
  const module = await import('write-excel-file/browser')
  return module.default
}

const BRAND_BLUE = '#1D4ED8'
const MUTED = '#475569'

const EXCEL_STATUS = {
  presente: { fill: '#D1FAE5', color: '#065F46' },
  falta: { fill: '#FFE4E6', color: '#9F1239' },
  justificado: { fill: '#FEF3C7', color: '#92400E' },
  pendiente: { fill: '#E0F2FE', color: '#075985' },
  programada: { fill: '#F1F5F9', color: '#475569' },
}

const TIMING_TEXT = { pasada: 'Dictada', hoy: 'Hoy', futura: 'Programada' }

function header(value, extra = {}) {
  return {
    value,
    fontWeight: 'bold',
    textColor: '#FFFFFF',
    backgroundColor: BRAND_BLUE,
    align: 'center',
    alignVertical: 'center',
    ...extra,
  }
}

function textCell(value, extra = {}) {
  return { value: value == null ? '' : String(value), type: String, ...extra }
}

function percentCell(percent) {
  if (percent == null) return { value: '—', type: String, align: 'center', textColor: MUTED }
  return { value: percent / 100, type: Number, format: '0.0%', align: 'center' }
}

function numberCell(value) {
  return { value, type: Number, align: 'center' }
}

/** Fila que ocupa `span` columnas (las celdas cubiertas deben ir en null). */
function spanRow(cell, span) {
  return [{ ...cell, columnSpan: span }, ...Array(span - 1).fill(null)]
}

/** RF-17: exporta las asistencias del módulo activo a un libro con resumen, detalle y clases. */
export async function exportAttendanceWorkbook({ modulo, model, todayISO }) {
  const writeExcelFile = await loadWriter()
  const { classes, students, overall } = model

  const resumen = [
    spanRow({ value: `Reporte de asistencia — ${modulo.nombre}`, fontWeight: 'bold', fontSize: 14 }, 7),
    spanRow({ value: `Generado el ${formatDateLong(todayISO)} · CODERS · Control de Asistencia`, textColor: MUTED }, 7),
    spanRow(
      {
        value: `Estudiantes: ${students.length}  ·  Clases: ${classes.length}  ·  Asistencia general: ${
          overall.porcentaje == null ? '—' : `${overall.porcentaje}%`
        }`,
        textColor: MUTED,
      },
      7,
    ),
    [null],
    [
      header('Nº registro'),
      header('Estudiante'),
      header('Correo electrónico'),
      header('Presentes'),
      header('Faltas'),
      header('Justificados'),
      header('% Asistencia'),
    ],
    ...students.map((student) => [
      textCell(student.nroRegistro),
      textCell(student.nombreCompleto),
      textCell(student.email),
      numberCell(student.summary.presente),
      numberCell(student.summary.falta),
      numberCell(student.summary.justificado),
      percentCell(student.summary.porcentaje),
    ]),
  ]

  const detalle = [
    [
      header('Nº registro'),
      header('Estudiante'),
      ...classes.map((clase) => header(`${clase.label}\n${formatDayMonth(clase.fechaProgramada)}`, { wrap: true })),
      header('Presentes'),
      header('Faltas'),
      header('Justificados'),
      header('%'),
    ],
    ...students.map((student) => [
      textCell(student.nroRegistro),
      textCell(student.nombreCompleto),
      ...student.cells.map((cell) => {
        const palette = EXCEL_STATUS[cell.status]
        const label = STATUS[cell.status].label
        return textCell(cell.status === 'presente' && cell.hora ? `${label} ${cell.hora.slice(0, 5)}` : label, {
          backgroundColor: palette.fill,
          textColor: palette.color,
          align: 'center',
        })
      }),
      numberCell(student.summary.presente),
      numberCell(student.summary.falta),
      numberCell(student.summary.justificado),
      percentCell(student.summary.porcentaje),
    ]),
  ]

  const clasesSheet = [
    [
      header('Clase'),
      header('Fecha'),
      header('Horario'),
      header('Estado'),
      header('Presentes'),
      header('Faltas'),
      header('Justificados'),
      header('Sin marcar'),
      header('% Asistencia'),
    ],
    ...classes.map((clase) => [
      textCell(clase.label),
      textCell(formatDateShort(clase.fechaProgramada)),
      textCell(formatTimeRange(clase.horaInicio, clase.horaFin)),
      textCell(TIMING_TEXT[clase.timing]),
      numberCell(clase.summary.presente),
      numberCell(clase.summary.falta),
      numberCell(clase.summary.justificado),
      numberCell(clase.summary.pendiente),
      percentCell(clase.rate),
    ]),
  ]

  const fileName = `asistencia_${slugify(modulo.nombre) || 'modulo'}_${todayISO}.xlsx`

  await writeExcelFile(
    [
      {
        data: resumen,
        sheet: 'Resumen',
        columns: [{ width: 16 }, { width: 34 }, { width: 32 }, { width: 12 }, { width: 10 }, { width: 13 }, { width: 14 }],
        stickyRowsCount: 5,
      },
      {
        data: detalle,
        sheet: 'Detalle por fecha',
        columns: [{ width: 16 }, { width: 32 }, ...classes.map(() => ({ width: 15 })), { width: 11 }, { width: 9 }, { width: 12 }, { width: 9 }],
        stickyRowsCount: 1,
        stickyColumnsCount: 2,
      },
      {
        data: clasesSheet,
        sheet: 'Clases',
        columns: [{ width: 22 }, { width: 16 }, { width: 18 }, { width: 13 }, { width: 11 }, { width: 9 }, { width: 13 }, { width: 12 }, { width: 14 }],
        stickyRowsCount: 1,
      },
    ],
    { fontFamily: 'Calibri', fontSize: 11 },
  ).toFile(fileName)

  return fileName
}

/** Plantilla con el formato exacto que valida el backend (RF-11). */
export async function downloadStudentsTemplate() {
  const writeExcelFile = await loadWriter()
  const data = [
    [header('Número de registro'), header('Nombre completo'), header('Correo electrónico')],
    [textCell('1001', { format: '@' }), textCell('Juan Pérez'), textCell('juan@gmail.com')],
    [textCell('1002', { format: '@' }), textCell('María López'), textCell('maria@gmail.com')],
  ]
  await writeExcelFile(data, {
    sheet: 'Estudiantes',
    columns: [{ width: 22 }, { width: 36 }, { width: 34 }],
    stickyRowsCount: 1,
  }).toFile('plantilla_estudiantes.xlsx')
}

/** Plantilla de fechas y horarios de clase (RF-12). */
export async function downloadScheduleTemplate() {
  const writeExcelFile = await loadWriter()
  const data = [
    [header('Fecha'), header('Hora inicio'), header('Hora fin')],
    [textCell('05/10/2026', { format: '@' }), textCell('18:00', { format: '@' }), textCell('21:00', { format: '@' })],
    [textCell('07/10/2026', { format: '@' }), textCell('18:00', { format: '@' }), textCell('21:00', { format: '@' })],
  ]
  await writeExcelFile(data, {
    sheet: 'Fechas de clases',
    columns: [{ width: 16 }, { width: 14 }, { width: 14 }],
    stickyRowsCount: 1,
  }).toFile('plantilla_fechas_clases.xlsx')
}
