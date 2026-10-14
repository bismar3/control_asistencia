import { useEffect, useRef, useState } from 'react'

/** Anima un número desde su valor anterior hasta `target` (respeta prefers-reduced-motion). */
export function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0)
  const current = useRef(0)

  useEffect(() => {
    if (typeof target !== 'number' || !Number.isFinite(target)) return undefined
    const from = current.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = reduceMotion ? 0 : duration
    const start = performance.now()
    let frame

    const tick = (time) => {
      const progress = total === 0 ? 1 : Math.min(1, (time - start) / total)
      const eased = 1 - (1 - progress) ** 3
      const value = from + (target - from) * eased
      current.current = value
      setDisplay(value)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return display
}
