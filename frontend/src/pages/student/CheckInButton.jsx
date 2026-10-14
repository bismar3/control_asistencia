import { CalendarOff, Fingerprint, ShieldCheck } from 'lucide-react'
import styles from './CheckInButton.module.css'
import Skeleton from '../../components/ui/Skeleton'
import { cx } from '../../lib/cx'

const PARTICLES = Array.from({ length: 16 }, (_, index) => ({
  angle: `${(360 / 16) * index}deg`,
  distance: `${index % 2 ? 118 : 92}px`,
  color: ['#22d3ee', '#34d399', '#3b82f6', '#a78bfa'][index % 4],
}))

const LABELS = {
  available: 'Marcar asistencia',
  marking: 'Registrando…',
  done: 'Presente',
  justified: 'Justificado',
  none: 'Sin clase hoy',
  closed: 'No disponible',
}

/**
 * Botón principal de marcado (RF-03). Solo está habilitado el día de clase (RN-04)
 * y mientras el estudiante no haya marcado (RN-03).
 */
export default function CheckInButton({ state, onMark, celebrate = false, markTime }) {
  if (state === 'loading') {
    return (
      <div className={styles.wrap}>
        <Skeleton width={190} height={190} radius="50%" />
      </div>
    )
  }

  const enabled = state === 'available'

  return (
    <div className={cx(styles.wrap, styles[state])}>
      {enabled && (
        <span className={styles.rings} aria-hidden="true">
          <span style={{ '--delay': '0s' }} />
          <span style={{ '--delay': '0.9s' }} />
          <span style={{ '--delay': '1.8s' }} />
        </span>
      )}

      {celebrate && (
        <span className={styles.burst} aria-hidden="true">
          {PARTICLES.map((particle) => (
            <span
              key={particle.angle}
              style={{ '--a': particle.angle, '--d': particle.distance, '--c': particle.color }}
            />
          ))}
        </span>
      )}

      <button
        type="button"
        className={styles.button}
        onClick={onMark}
        disabled={!enabled}
        aria-busy={state === 'marking' || undefined}
        aria-label={LABELS[state]}
      >
        <span className={styles.face}>
          {state === 'done' ? (
            <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5.5 12.5l4.2 4.2L18.5 7.8" />
            </svg>
          ) : state === 'justified' ? (
            <ShieldCheck size={54} strokeWidth={1.8} aria-hidden="true" />
          ) : state === 'none' || state === 'closed' ? (
            <CalendarOff size={50} strokeWidth={1.7} aria-hidden="true" />
          ) : (
            <Fingerprint size={62} strokeWidth={1.6} aria-hidden="true" className={styles.fingerprint} />
          )}
          <span className={styles.label}>{LABELS[state]}</span>
          {state === 'done' && markTime && <span className={cx(styles.time, 'tabular')}>{markTime}</span>}
        </span>
      </button>
    </div>
  )
}
