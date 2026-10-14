import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors'

const OFFLINE_MESSAGE =
  'No se pudo conectar con el servidor. Verifica que el backend (Django) esté en ejecución en el puerto 8000.'

/** Convierte cualquier error de Apollo/red en un mensaje claro para la interfaz. */
export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado. Inténtalo nuevamente.') {
  if (!error) return fallback

  if (CombinedGraphQLErrors.is(error)) {
    const messages = error.errors.map((item) => item.message).filter(Boolean)
    return messages.length ? messages.join(' · ') : fallback
  }

  if (ServerError.is(error)) {
    // El proxy de Vite responde 5xx cuando Django no está levantado.
    if (error.statusCode >= 500) return OFFLINE_MESSAGE
    return `El servidor respondió con un error (${error.statusCode}).`
  }

  if (ServerParseError.is(error)) {
    return 'La respuesta del servidor no es válida. Revisa la URL del endpoint GraphQL.'
  }

  if (isNetworkError(error)) return OFFLINE_MESSAGE

  return error.message || fallback
}

export function isNetworkError(error) {
  if (!error) return false
  if (ServerError.is(error) && error.statusCode >= 500) return true
  return error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(error.message ?? '')
}
