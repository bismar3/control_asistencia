import styles from './Avatar.module.css'
import { cx } from '../../lib/cx'
import { hashIndex, initials } from '../../lib/format'

/** Avatar con iniciales y un degradado estable derivado del nombre. */
export default function Avatar({ name = '', size = 40, className, ring = false }) {
  return (
    <span
      className={cx(styles.avatar, styles[`g${hashIndex(name, 8)}`], ring && styles.ring, className)}
      style={{ '--size': `${size}px` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
