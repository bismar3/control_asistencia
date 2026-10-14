import { useRef } from 'react'
import styles from './SegmentedControl.module.css'
import { cx } from '../../lib/cx'

/**
 * Control segmentado estilo iOS: el indicador se desliza con CSS (--index / --count).
 * options: [{ value, label, icon?, count? }]
 */
export default function SegmentedControl({ options, value, onChange, ariaLabel, size = 'md', block = false, className }) {
  const refs = useRef([])
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  const handleKeyDown = (event, current) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = (current + keys[event.key] + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx(styles.root, styles[size], block && styles.block, className)}
      style={{ '--count': options.length, '--index': index }}
    >
      <span className={styles.thumb} aria-hidden="true" />
      {options.map((option, i) => {
        const selected = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[i] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={cx(styles.option, selected && styles.selected)}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, i)}
          >
            {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.2} aria-hidden="true" />}
            <span className={styles.text}>{option.label}</span>
            {option.count != null && <span className={styles.count}>{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
