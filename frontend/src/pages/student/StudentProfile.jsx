import { useQuery } from '@apollo/client/react'
import { BadgeCheck, BookOpen, Hash, LogOut, Mail, Palette, Phone, ShieldCheck } from 'lucide-react'
import styles from './StudentProfile.module.css'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { Tag } from '../../components/ui/StatusBadge'
import { ThemeSelector } from '../../components/ui/ThemeToggle'
import { CodersLogo } from '../../components/brand/CodersLogo'
import { useAuth } from '../../context/auth-context'
import { useToast } from '../../context/toast-context'
import { ESTUDIANTE_POR_REGISTRO } from '../../graphql/estudiantes'
import { MODULO_ACTIVO } from '../../graphql/modulo'

export default function StudentProfile() {
  const { session, logout } = useAuth()
  const toast = useToast()
  const cached = session.estudiante
  const { data } = useQuery(ESTUDIANTE_POR_REGISTRO, { variables: { nroRegistro: cached.nroRegistro } })
  const { data: moduloData } = useQuery(MODULO_ACTIVO)
  const estudiante = data?.estudiante ?? cached
  const modulo = moduloData?.moduloActivo

  const handleLogout = async () => {
    await logout()
    toast.info('Tu sesión se cerró correctamente.', { title: 'Hasta pronto' })
  }

  const details = [
    { icon: Hash, label: 'Número de registro', value: estudiante.nroRegistro, mono: true },
    { icon: Mail, label: 'Correo electrónico', value: estudiante.email || 'No registrado' },
    { icon: Phone, label: 'Celular', value: estudiante.celular || 'No registrado' },
    { icon: BookOpen, label: 'Módulo activo', value: modulo?.nombre ?? '—' },
  ]

  return (
    <>
      <PageHeader eyebrow="Mi perfil" title="Tu cuenta" description="Los datos con los que figuras en el módulo académico activo." />

      <div className={styles.grid}>
        <Card className={styles.profile}>
          <div className={styles.identity}>
            <div className={styles.avatarWrap}>
              <Avatar name={estudiante.nombreCompleto} size={92} ring />
            </div>
            <h2 className={styles.name}>{estudiante.nombreCompleto}</h2>
            <Tag tone="ok" icon={BadgeCheck}>
              Estudiante inscrito
            </Tag>
          </div>

          <dl className={styles.details}>
            {details.map(({ icon: Icon, label, value, mono }, index) => (
              <div key={label} className={`${styles.detail} anim-fade-up`} style={{ '--i': index + 1 }}>
                <dt>
                  <Icon size={16} aria-hidden="true" /> {label}
                </dt>
                <dd className={mono ? 'mono' : undefined}>{value}</dd>
              </div>
            ))}
          </dl>

          <p className={styles.note}>
            <ShieldCheck size={15} aria-hidden="true" /> Si algún dato es incorrecto, solicita la corrección al administrador del módulo.
          </p>
        </Card>

        <div className={styles.side}>
          <Card title="Apariencia" subtitle="Elige cómo se ve la aplicación" icon={Palette}>
            <ThemeSelector block />
          </Card>

          <Card title="Sesión" subtitle="Cierra tu sesión al terminar en equipos compartidos" icon={LogOut}>
            <Button variant="danger" icon={LogOut} block onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </Card>

          <Card bodyClassName={styles.about}>
            <CodersLogo className={styles.logo} />
            <p>
              Sistema de Control de Asistencia desarrollado por el equipo <strong>CODERS</strong>.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}
