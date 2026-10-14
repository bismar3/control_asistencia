import { Monitor, Moon, Sun } from 'lucide-react'
import styles from './ThemeToggle.module.css'
import SegmentedControl from './SegmentedControl'
import { useTheme } from '../../context/theme-context'
import { cx } from '../../lib/cx'

/** Botón redondo que alterna claro/oscuro con revelación circular. */
export default function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className={cx(styles.toggle, dark && styles.dark, className)}
      onClick={(event) => toggle(event)}
      aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={dark ? 'Tema claro' : 'Tema oscuro'}
    >
      <Sun className={styles.sun} size={18} strokeWidth={2.2} aria-hidden="true" />
      <Moon className={styles.moon} size={18} strokeWidth={2.2} aria-hidden="true" />
    </button>
  )
}

/** Selector completo Claro / Oscuro / Sistema (página de ajustes y perfil). */
export function ThemeSelector({ block }) {
  const { preference, setPreference } = useTheme()
  return (
    <SegmentedControl
      ariaLabel="Tema de la interfaz"
      value={preference}
      onChange={setPreference}
      block={block}
      options={[
        { value: 'light', label: 'Claro', icon: Sun },
        { value: 'dark', label: 'Oscuro', icon: Moon },
        { value: 'system', label: 'Sistema', icon: Monitor },
      ]}
    />
  )
}
