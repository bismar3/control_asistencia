import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { House, RefreshCw, TriangleAlert } from 'lucide-react'
import AuroraBackground from './AuroraBackground'
import EmptyState from '../ui/EmptyState'
import Button from '../ui/Button'
import styles from './RouteError.module.css'

/** Límite de error de rutas: muestra un mensaje amable en vez de una pantalla en blanco. */
export default function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const chunkError = /dynamically imported module|importing a module script/i.test(error?.message ?? '')

  return (
    <main className={styles.page}>
      <AuroraBackground />
      <div className={`glass ${styles.card}`}>
        <EmptyState
          icon={TriangleAlert}
          tone="bad"
          title={notFound ? 'Página no encontrada' : 'Algo salió mal'}
          description={
            chunkError
              ? 'Se publicó una nueva versión de la aplicación. Recarga la página para continuar.'
              : (error?.statusText ?? error?.message ?? 'Ocurrió un error inesperado al mostrar esta página.')
          }
          action={
            <>
              <Button icon={RefreshCw} variant="secondary" onClick={() => window.location.reload()}>
                Recargar
              </Button>
              <Link to="/" className={styles.homeLink}>
                <House size={16} /> Ir al inicio
              </Link>
            </>
          }
        />
      </div>
    </main>
  )
}
