import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useQuery } from '@apollo/client/react'
import { CalendarDays, House, UserRound } from 'lucide-react'
import styles from './StudentLayout.module.css'
import AuroraBackground from '../AuroraBackground'
import ThemeToggle from '../../ui/ThemeToggle'
import Avatar from '../../ui/Avatar'
import { CodersBrand, CodersCredit } from '../../brand/CodersLogo'
import { useAuth } from '../../../context/auth-context'
import { useToast } from '../../../context/toast-context'
import { VERIFICAR_INSCRIPCION } from '../../../graphql/estudiantes'
import { cx } from '../../../lib/cx'

const TABS = [
  { to: '/estudiante', label: 'Inicio', icon: House, end: true },
  { to: '/estudiante/historial', label: 'Historial', icon: CalendarDays },
  { to: '/estudiante/perfil', label: 'Perfil', icon: UserRound },
]

function activeTabIndex(pathname) {
  const index = TABS.findIndex((tab) => (tab.end ? pathname === tab.to : pathname.startsWith(tab.to)))
  return index === -1 ? 0 : index
}

/**
 * Verifica periódicamente que el estudiante siga inscrito en el módulo activo (RF-01).
 * Si el administrador activó un módulo nuevo sin este estudiante, la sesión se cierra.
 */
function useEnrollmentGuard(estudiante) {
  const { logout } = useAuth()
  const toast = useToast()
  const { data } = useQuery(VERIFICAR_INSCRIPCION, {
    variables: { busqueda: estudiante?.nroRegistro ?? '' },
    skip: !estudiante,
    fetchPolicy: 'network-only',
    pollInterval: 120_000,
  })

  useEffect(() => {
    if (!data || !estudiante) return
    const enrolled = data.estudiantesModuloActivo?.some((item) => String(item.id) === String(estudiante.id))
    if (!data.moduloActivo || !enrolled) {
      logout()
      toast.warning('El módulo académico cambió y ya no figuras en la lista activa. Consulta con tu administrador.', {
        title: 'Sesión finalizada',
        duration: 8000,
      })
    }
  }, [data, estudiante, logout, toast])

  return data?.moduloActivo ?? null
}

function TabLinks({ className, linkClassName, activeClassName, iconSize = 18 }) {
  return TABS.map((tab) => {
    const Icon = tab.icon
    return (
      <NavLink
        key={tab.to}
        to={tab.to}
        end={tab.end}
        className={({ isActive }) => cx(linkClassName, isActive && activeClassName, className)}
      >
        <Icon size={iconSize} strokeWidth={2.2} aria-hidden="true" />
        <span>{tab.label}</span>
      </NavLink>
    )
  })
}

export default function StudentLayout() {
  const { session } = useAuth()
  const location = useLocation()
  const estudiante = session?.estudiante
  const modulo = useEnrollmentGuard(estudiante)
  const index = activeTabIndex(location.pathname)

  return (
    <div className={styles.shell}>
      <AuroraBackground />

      <header className={styles.topbar}>
        <Link to="/estudiante" className={styles.brand} aria-label="Inicio">
          <CodersBrand size={38} subtitle={modulo?.nombre ?? 'Control de Asistencia'} />
        </Link>

        <nav className={styles.pillNav} style={{ '--index': index, '--count': TABS.length }} aria-label="Secciones">
          <span className={styles.pillThumb} aria-hidden="true" />
          <TabLinks linkClassName={styles.pillLink} activeClassName={styles.pillActive} iconSize={16} />
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <Link to="/estudiante/perfil" className={styles.avatarLink} aria-label="Mi perfil">
            <Avatar name={estudiante?.nombreCompleto} size={38} />
          </Link>
        </div>
      </header>

      <main className={styles.content}>
        <div key={location.pathname} className={styles.page}>
          <Outlet />
        </div>
      </main>

      <footer className={styles.footer}>
        <CodersCredit />
      </footer>

      <nav className={styles.tabbar} style={{ '--index': index, '--count': TABS.length }} aria-label="Navegación inferior">
        <span className={styles.tabThumb} aria-hidden="true" />
        <TabLinks linkClassName={styles.tabLink} activeClassName={styles.tabActive} iconSize={21} />
      </nav>
    </div>
  )
}
