import { ArrowLeft } from 'lucide-react'
import styles from './NotFound.module.css'
import AuroraBackground from '../components/layout/AuroraBackground'
import LinkButton from '../components/ui/LinkButton'
import { CodersMark } from '../components/brand/CodersLogo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Página no encontrada')
  return (
    <main className={styles.page}>
      <AuroraBackground />
      <div className={`glass ${styles.card}`}>
        <CodersMark size={88} glow className={styles.mark} />
        <p className={styles.code}>
          <span>&gt;_</span> 404
        </p>
        <h1 className={styles.title}>Esta página no existe</h1>
        <p className={styles.text}>Puede que el enlace esté roto o que la página se haya movido.</p>
        <LinkButton to="/" icon={ArrowLeft}>
          Volver al inicio
        </LinkButton>
      </div>
    </main>
  )
}
