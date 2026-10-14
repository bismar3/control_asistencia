import { Outlet, ScrollRestoration, useNavigation } from 'react-router'
import styles from './RootLayout.module.css'

/** Raíz de la app: barra de progreso de navegación + restauración de scroll. */
export default function RootLayout() {
  const navigation = useNavigation()
  return (
    <>
      {navigation.state !== 'idle' && <div className={styles.progress} role="progressbar" aria-label="Cargando página" />}
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
