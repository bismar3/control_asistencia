import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { STORAGE_KEYS } from '../config'
import { AuthContext } from './auth-context'

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session)
    const session = raw ? JSON.parse(raw) : null
    return session?.rol ? session : null
  } catch {
    return null
  }
}

/**
 * Sesión del cliente. El backend valida las credenciales en loginEstudiante / loginAdmin
 * y el frontend conserva el perfil devuelto para restringir rutas por rol (RF-02).
 */
export function AuthProvider({ children }) {
  const client = useApolloClient()
  const [session, setSession] = useState(readSession)

  // Mantiene sincronizadas varias pestañas (cerrar sesión en una cierra en todas).
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.session) setSession(readSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback((data) => {
    const next = { ...data, loggedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(next))
    setSession(next)
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEYS.session)
    setSession(null)
    await client.clearStore()
  }, [client])

  const value = useMemo(
    () => ({
      session,
      isAdmin: session?.rol === 'ADMIN',
      isStudent: session?.rol === 'ESTUDIANTE',
      adminEmail: session?.rol === 'ADMIN' ? session.usuario?.email : undefined,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
