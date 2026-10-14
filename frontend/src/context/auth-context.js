import { createContext, use } from 'react'

export const AuthContext = createContext(null)

/** Sesión actual: { session, isAdmin, isStudent, adminEmail, login(), logout() } */
export function useAuth() {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
