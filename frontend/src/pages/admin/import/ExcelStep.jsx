import { useState } from 'react'
import { Download } from 'lucide-react'
import styles from './Import.module.css'
import ValidationReport from './ValidationReport'
import Dropzone from '../../../components/ui/Dropzone'
import Button from '../../../components/ui/Button'
import { useToast } from '../../../context/toast-context'
import { downloadScheduleTemplate, downloadStudentsTemplate } from '../../../lib/excel'
import { getErrorMessage } from '../../../lib/errors'

const COPY = {
  estudiantes: {
    columns: ['Número de registro', 'Nombre completo', 'Correo electrónico'],
    hint: 'Una fila por estudiante. El número de registro no puede repetirse.',
    template: downloadStudentsTemplate,
  },
  fechas: {
    columns: ['Fecha (DD/MM/AAAA)', 'Hora inicio', 'Hora fin'],
    hint: 'Una fila por clase. Las fechas determinan los días habilitados para marcar.',
    template: downloadScheduleTemplate,
  },
}

/** Carga + validación de un archivo Excel con descarga de plantilla. */
export default function ExcelStep({ kind, validation }) {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const copy = COPY[kind]

  const handleTemplate = async () => {
    setDownloading(true)
    try {
      await copy.template()
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo generar la plantilla.'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={styles.excelStep}>
      <div className={styles.formatBox}>
        <div>
          <p className={styles.formatTitle}>Formato esperado</p>
          <div className={styles.columns}>
            {copy.columns.map((column, index) => (
              <span key={column} className={styles.columnChip}>
                <b>{String.fromCharCode(65 + index)}</b> {column}
              </span>
            ))}
          </div>
          <p className={styles.formatHint}>{copy.hint}</p>
        </div>
        <Button variant="soft" size="sm" icon={Download} onClick={handleTemplate} loading={downloading}>
          Descargar plantilla
        </Button>
      </div>

      <Dropzone
        file={validation.file}
        busy={validation.validating}
        onFile={validation.select}
        onClear={validation.reset}
        title={kind === 'estudiantes' ? 'Arrastra el Excel de estudiantes' : 'Arrastra el Excel de fechas y horarios'}
      />

      <ValidationReport kind={kind} validation={validation} />
    </div>
  )
}
