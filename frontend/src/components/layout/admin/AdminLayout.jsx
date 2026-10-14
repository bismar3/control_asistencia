import { useMemo, useState } from 'react'
import { Outlet, useLocation, useMatches } from 'react-router'
import { useQuery } from '@apollo/client/react'
import styles from './AdminLayout.module.css'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import AuroraBackground from '../AuroraBackground'
import { CodersCredit } from '../../brand/CodersLogo'
import { useAuth } from '../../../context/auth-context'
import { useToast } from '../../../context/toast-context'
import { useToday } from '../../../hooks/useNow'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { CLASES_MODULO, MODULO_ACTIVO } from '../../../graphql/modulo'
import { decorateClasses } from '../../../lib/attendance'

export default function AdminLayout() {
  const { session, logout } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const matches = useMatches()
  const today = useToday()
  const [menuOpen, setMenuOpen] = useState(false)

  const title = [...matches].reverse().find((match) => match.handle?.title)?.handle.title ?? 'Panel general'
  useDocumentTitle(title)

  const { data: moduloData, loading: moduloLoading } = useQuery(MODULO_ACTIVO)
  const modulo = moduloData?.moduloActivo ?? null
  const { data: clasesData } = useQuery(CLASES_MODULO, { skip: !modulo, pollInterval: 30_000 })

  const classes = useMemo(() => decorateClasses(clasesData?.clasesModulo ?? [], today), [clasesData, today])
  const todayClass = classes.find((clase) => clase.timing === 'hoy')

  const adminName = session?.administrador?.nombreCompleto || session?.usuario?.email?.split('@')[0] || 'Administrador'
  const adminEmail = session?.usuario?.email ?? ''

  const handleLogout = async () => {
    await logout()
    toast.info('Tu sesión se cerró correctamente.', { title: 'Hasta pronto' })
  }

  return (
    <div className={styles.shell}>
      <AuroraBackground />
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        modulo={modulo}
        classes={classes}
        loadingModule={moduloLoading}
        adminName={adminName}
        adminEmail={adminEmail}
        onLogout={handleLogout}
      />
      <div className={styles.main}>
        <Topbar
          title={title}
          onMenu={() => setMenuOpen(true)}
          today={today}
          todayClass={todayClass}
          totalStudents={modulo?.totalEstudiantes ?? 0}
          adminName={adminName}
        />
        <main className={styles.content} id="contenido">
          <div key={location.pathname} className={styles.page}>
            <Outlet />
          </div>
        </main>
        <footer className={styles.footer}>
          <CodersCredit />
          <span>Sistema de Control de Asistencia · v1.0</span>
        </footer>
      </div>
    </div>
  )
}
