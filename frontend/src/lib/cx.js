/** Une nombres de clase ignorando valores falsy: cx('a', cond && 'b') */
export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}
