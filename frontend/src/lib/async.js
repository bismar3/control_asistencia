/**
 * Ejecuta `worker` sobre cada elemento con concurrencia limitada.
 * Devuelve [{ ok, value | error }] en el mismo orden y reporta el avance.
 */
export async function runPool(items, worker, { limit = 4, onProgress } = {}) {
  const results = new Array(items.length)
  let cursor = 0
  let done = 0

  const lane = async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      try {
        results[index] = { ok: true, value: await worker(items[index], index) }
      } catch (error) {
        results[index] = { ok: false, error }
      }
      done += 1
      onProgress?.(done, items.length)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane))
  return results
}
