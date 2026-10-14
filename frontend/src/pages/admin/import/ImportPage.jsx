import { useSearchParams } from 'react-router'
import { useQuery } from '@apollo/client/react'
import { Archive, CalendarDays, Layers, RefreshCw, Rocket, UsersRound } from 'lucide-react'
import styles from './Import.module.css'
import NewModuleWizard from './NewModuleWizard'
import UpdateModule from './UpdateModule'
import PageHeader from '../../../components/layout/PageHeader'
import SegmentedControl from '../../../components/ui/SegmentedControl'
import Skeleton from '../../../components/ui/Skeleton'
import LiveDot from '../../../components/ui/LiveDot'
import Card from '../../../components/ui/Card'
import ErrorState from '../../../components/ui/ErrorState'
import { MODULO_ACTIVO } from '../../../graphql/modulo'
import { formatDate, zonedDateOf } from '../../../lib/dates'
import { cx } from '../../../lib/cx'

function CurrentModule({ modulo, loading }) {
  if (loading) return <Skeleton height={96} radius={26} />
  if (!modulo) {
    return (
      <div className={cx('glass', styles.current, styles.currentEmpty)}>
        <span className={styles.currentIcon} aria-hidden="true">
          <Archive size={22} />
        </span>
        <div>
          <p className={styles.currentLabel}>Sin módulo activo</p>
          <p className={styles.currentText}>Activa el primer módulo cargando sus estudiantes y fechas de clase.</p>
        </div>
      </div>
    )
  }
  return (
    <div className={cx('glass', styles.current)}>
      <span className={styles.currentIcon} aria-hidden="true">
        <Layers size={22} />
      </span>
      <div className={styles.currentInfo}>
        <p className={styles.currentLabel}>
          <LiveDot tone="ok" /> Módulo activo
        </p>
        <p className={styles.currentName}>{modulo.nombre}</p>
      </div>
      <div className={styles.currentStats}>
        <span>
          <UsersRound size={15} aria-hidden="true" /> <strong className="tabular">{modulo.totalEstudiantes}</strong> estudiantes
        </span>
        <span>
          <CalendarDays size={15} aria-hidden="true" /> <strong className="tabular">{modulo.totalClases}</strong> clases
        </span>
        <span className={styles.currentSince}>Creado el {formatDate(zonedDateOf(modulo.createdAt))}</span>
      </div>
    </div>
  )
}

export default function ImportPage() {
  const [params, setParams] = useSearchParams()
  const { data, loading, error, refetch } = useQuery(MODULO_ACTIVO)
  const modulo = data?.moduloActivo ?? null
  const mode = params.get('modo') === 'actualizar' && modulo ? 'actualizar' : 'nuevo'

  return (
    <>
      <PageHeader
        eyebrow="Importación y reinicio"
        title="Importar y módulos"
        description="Carga estudiantes y fechas desde Excel: activa un nuevo módulo o complementa el módulo vigente. Nada se borra de la base de datos."
      />

      {error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : (
        <>
          <CurrentModule modulo={modulo} loading={loading && !data} />

          {modulo && (
            <SegmentedControl
              ariaLabel="Tipo de carga"
              className={styles.modeSwitch}
              value={mode}
              onChange={(value) => setParams(value === 'actualizar' ? { modo: 'actualizar' } : {}, { replace: true })}
              options={[
                { value: 'nuevo', label: 'Activar nuevo módulo', icon: Rocket },
                { value: 'actualizar', label: 'Actualizar módulo activo', icon: RefreshCw },
              ]}
            />
          )}

          {data && (mode === 'nuevo' ? <NewModuleWizard currentModule={modulo} /> : <UpdateModule modulo={modulo} />)}
        </>
      )}
    </>
  )
}
