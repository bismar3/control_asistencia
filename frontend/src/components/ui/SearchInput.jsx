import { Search, X } from 'lucide-react'
import styles from './SearchInput.module.css'
import { cx } from '../../lib/cx'

export default function SearchInput({ value, onChange, placeholder = 'Buscar…', className, label = 'Buscar', ...rest }) {
  return (
    <div className={cx(styles.search, className)}>
      <Search className={styles.icon} size={17} aria-hidden="true" />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
      {value && (
        <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label="Limpiar búsqueda">
          <X size={14} strokeWidth={2.6} />
        </button>
      )}
    </div>
  )
}
