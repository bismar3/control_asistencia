import { Link } from 'react-router'
import { CalendarDays, ChevronRight, Menu } from 'lucide-react'
import styles from './AdminLayout.module.css'
import ThemeToggle from '../../ui/ThemeToggle'
import LiveDot from '../../ui/LiveDot'
import Avatar from '../../ui/Avatar'
import { CodersMark } from '../../brand/CodersLogo'
import { formatDateMedium } from '../../../lib/dates'
import { capitalize } from '../../../lib/format'

export default function Topbar({ title, onMenu, today, todayClass, totalStudents, adminName }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <button type="button" className={styles.menuButton} onClick={onMenu} aria-label="Abrir menú">
          <Menu size={20} />
        </button>
        <Link to="/admin" className={styles.topbarMark} aria-label="Inicio">
          <CodersMark size={34} glow />
        </Link>
        <nav className={styles.breadcrumb} aria-label="Ruta">
          <span>Administración</span>
          <ChevronRight size={14} aria-hidden="true" />
          <strong>{title}</strong>
        </nav>
      </div>

      <div className={styles.topbarRight}>
        {todayClass ? (
          <Link to="/admin/asistencias" className={styles.liveChip} title="Ver asistencias de hoy">
            <LiveDot tone="ok" />
            <span>
              Clase en curso · <strong className="tabular">{todayClass.totalPresentes ?? 0}</strong>/{totalStudents} presentes
            </span>
          </Link>
        ) : (
          <span className={styles.dateChip}>
            <CalendarDays size={15} aria-hidden="true" />
            {capitalize(formatDateMedium(today))}
          </span>
        )}
        <ThemeToggle />
        <Link to="/admin/ajustes" className={styles.topbarAvatar} aria-label="Ajustes de la cuenta">
          <Avatar name={adminName} size={36} />
        </Link>
      </div>
    </header>
  )
}
