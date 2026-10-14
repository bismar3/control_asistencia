import { RefreshCw, ServerCrash, WifiOff } from 'lucide-react'
import EmptyState from './EmptyState'
import Button from './Button'
import { getErrorMessage, isNetworkError } from '../../lib/errors'

export default function ErrorState({ error, onRetry, title, compact }) {
  const offline = isNetworkError(error)
  return (
    <EmptyState
      icon={offline ? WifiOff : ServerCrash}
      tone="bad"
      compact={compact}
      title={title ?? (offline ? 'Sin conexión con el servidor' : 'No se pudo cargar la información')}
      description={getErrorMessage(error)}
      action={
        onRetry && (
          <Button variant="secondary" icon={RefreshCw} onClick={() => onRetry()}>
            Reintentar
          </Button>
        )
      }
    />
  )
}
