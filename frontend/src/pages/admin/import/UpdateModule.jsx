import { useState } from 'react'
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react'
import { CalendarPlus, FileSpreadsheet, History, Upload, UserPlus } from 'lucide-react'
import styles from './Import.module.css'
import ExcelStep from './ExcelStep'
import { useExcelValidation } from './useExcelValidation'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonRows } from '../../../components/ui/Skeleton'
import { Tag } from '../../../components/ui/StatusBadge'
import { useAuth } from '../../../context/auth-context'
import { useToast } from '../../../context/toast-context'
import { HISTORIAL_IMPORTACIONES, IMPORTAR_ESTUDIANTES, IMPORTAR_FECHAS } from '../../../graphql/importacion'
import { formatDateTime } from '../../../lib/dates'
import { getErrorMessage } from '../../../lib/errors'

/** Carga incremental sobre el módulo vigente (agregar estudiantes tardíos o fechas nuevas). */
export default function UpdateModule({ modulo }) {
  const { adminEmail } = useAuth()
  const toast = useToast()
  const client = useApolloClient()
  const students = useExcelValidation('estudiantes')
  const dates = useExcelValidation('fechas')
  const [busy, setBusy] = useState(null)
  const [importarEstudiantes] = useMutation(IMPORTAR_ESTUDIANTES)
  const [importarFechas] = useMutation(IMPORTAR_FECHAS)
  const { data, loading } = useQuery(HISTORIAL_IMPORTACIONES, { variables: { moduloId: Number(modulo.id) } })
  const history = data?.historialImportaciones ?? []

  const runImport = async (kind) => {
    const validation = kind === 'estudiantes' ? students : dates
    const mutate = kind === 'estudiantes' ? importarEstudiantes : importarFechas
    const field = kind === 'estudiantes' ? 'importarEstudiantesExcel' : 'importarFechasExcel'
    setBusy(kind)
    try {
      const { data: response } = await mutate({
        variables: {
          moduloId: Number(modulo.id),
          archivoBase64: validation.base64,
          nombreArchivo: validation.file.name,
          adminEmail,
        },
      })
      const result = response?.[field]
      if (!result?.success) {
        toast.error(result?.message ?? 'No se pudo completar la importación.')
        return
      }
      toast.success(result.message, { title: 'Importación completada' })
      validation.reset()
      await client.refetchQueries({ include: 'active' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className={styles.updateGrid}>
        <Card
          title="Estudiantes"
          subtitle="Los registros existentes se actualizan y los nuevos se inscriben en el módulo."
          icon={UserPlus}
          className="anim-fade-up"
          style={{ '--i': 1 }}
        >
          <ExcelStep kind="estudiantes" validation={students} />
          <Button
            className={styles.importButton}
            icon={Upload}
            block
            disabled={!students.valid}
            loading={busy === 'estudiantes'}
            onClick={() => runImport('estudiantes')}
          >
            {students.valid ? `Importar ${students.result.totalValidos} estudiantes` : 'Importar estudiantes'}
          </Button>
        </Card>

        <Card
          title="Fechas de clase"
          subtitle="Las fechas nuevas se programan y las existentes actualizan su horario."
          icon={CalendarPlus}
          className="anim-fade-up"
          style={{ '--i': 2 }}
        >
          <ExcelStep kind="fechas" validation={dates} />
          <Button className={styles.importButton} icon={Upload} block disabled={!dates.valid} loading={busy === 'fechas'} onClick={() => runImport('fechas')}>
            {dates.valid ? `Importar ${dates.result.totalValidos} fechas` : 'Importar fechas'}
          </Button>
        </Card>
      </div>

      <Card title="Historial de importaciones" subtitle={`Archivos cargados en «${modulo.nombre}»`} icon={History} padding="none">
        {loading && !data ? (
          <div className={styles.pad}>
            <SkeletonRows rows={3} height={48} />
          </div>
        ) : history.length === 0 ? (
          <EmptyState compact icon={FileSpreadsheet} tone="neutral" title="Aún no hay importaciones en este módulo" />
        ) : (
          <div className={styles.historyWrap}>
            <table className={styles.previewTable}>
              <thead>
                <tr>
                  <th scope="col">Archivo</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Registros</th>
                  <th scope="col">Subido por</th>
                  <th scope="col">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={styles.fileName}>
                        <FileSpreadsheet size={15} aria-hidden="true" /> {item.nombreOriginal}
                      </span>
                    </td>
                    <td>
                      <Tag tone={item.tipo === 'ESTUDIANTES' ? 'accent' : 'info'} size="sm">
                        {item.tipo === 'ESTUDIANTES' ? 'Estudiantes' : 'Fechas'}
                      </Tag>
                    </td>
                    <td className="tabular">{item.totalExitosos}</td>
                    <td className={styles.mutedCell}>{item.usuario?.email ?? 'Sistema'}</td>
                    <td className={styles.mutedCell}>{formatDateTime(item.fechaSubida)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
