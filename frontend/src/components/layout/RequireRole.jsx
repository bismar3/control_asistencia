import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../context/auth-context'
import { homeFor } from '../../lib/routes'

/**
 * Ruta protegida por rol (RF-02: funciones administrativas solo para administradores).
 * Sin sesión → /login; con otro rol → su propio panel.
 */
export default function RequireRole({ role, children }) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (session.rol !== role) return <Navigate to={homeFor(session.rol)} replace />
  return children ?? <Outlet />
}

/** Redirige "/" al panel que corresponde a la sesión. */
export function HomeRedirect() {
  const { session } = useAuth()
  return <Navigate to={session ? homeFor(session.rol) : '/login'} replace />
}
