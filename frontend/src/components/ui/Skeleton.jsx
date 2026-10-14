import styles from './Skeleton.module.css'
import { cx } from '../../lib/cx'

export default function Skeleton({ width = '100%', height = 16, radius, className, style }) {
  return (
    <span
      className={cx(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

/** Bloque de carga con varias líneas, para tarjetas y listas. */
export function SkeletonRows({ rows = 4, height = 52, gap = 10 }) {
  return (
    <div className={styles.rows} style={{ gap }} role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height={height} radius={14} style={{ opacity: 1 - index * 0.12 }} />
      ))}
    </div>
  )
}
