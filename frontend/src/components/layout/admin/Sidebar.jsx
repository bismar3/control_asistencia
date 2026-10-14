import { Link, NavLink } from 'react-router'
import {
  CalendarDays,
  ClipboardCheck,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  UsersRound,
  X,
} from 'lucide-react'
import styles from './AdminLayout.module.css'
import ModuleCard from './ModuleCard'
import Avatar from '../../ui/Avatar'
import { CodersBrand } from '../../brand/CodersLogo'
import { cx } from '../../../lib/cx'

const NAV = [
  {
    title: 'General',
    items: [
      { to: '/admin', label: 'Panel general', icon: LayoutDashboard, end: true },
      { to: '/admin/asistencias', label: 'Asistencias', icon: ClipboardCheck },
      { to: '/admin/estudiantes', label: 'Estudiantes', icon: UsersRound },
      { to: '/admin/calendario', label: 'Calendario', icon: CalendarDays },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { to: '/admin/actividad', label: 'Historial de actividad', icon: History },
      { to: '/admin/importar', label: 'Importar y módulos', icon: FileSpreadsheet },
      { to: '/admin/ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
]

export default function Sidebar({ open, onClose, modulo, classes, loadingModule, adminName, adminEmail, onLogout }) {
  return (
    <>
      <div className={cx(styles.scrim, open && styles.scrimVisible)} onClick={onClose} aria-hidden="true" />
      <aside className={cx('glass-strong', styles.sidebar, open && styles.sidebarOpen)} aria-label="Navegación principal">
        <div className={styles.sidebarHeader}>
          <Link to="/admin" className={styles.brandLink} onClick={onClose} aria-label="CODERS · Panel general">
            <CodersBrand subtitle="Panel administrativo" />
          </Link>
          <button type="button" className={styles.closeMenu} onClick={onClose} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>

        <ModuleCard modulo={modulo} classes={classes} loading={loadingModule} onNavigate={onClose} />

        <nav className={styles.nav}>
          {NAV.map((group) => (
            <div key={group.title} className={styles.navGroup}>
              <p className={styles.navTitle}>{group.title}</p>
              <ul className={styles.navList}>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) => cx(styles.navLink, isActive && styles.navActive)}
                      >
                        <span className={styles.navIcon}>
                          <Icon size={18} strokeWidth={2.1} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/admin/ajustes" className={styles.profile} onClick={onClose}>
            <Avatar name={adminName} size={38} />
            <span className={styles.profileText}>
              <strong className="truncate">{adminName}</strong>
              <span className="truncate">{adminEmail}</span>
            </span>
          </Link>
          <button type="button" className={styles.logout} onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  )
}
