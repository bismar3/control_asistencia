export const EXCEL_ACCEPT = '.xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const MAX_EXCEL_BYTES = 5 * 1024 * 1024

/** Validación previa en el cliente (el backend usa openpyxl, que no lee el formato antiguo .xls). */
export function validateExcelFile(file) {
  if (!file) return 'Selecciona un archivo de Excel.'
  const name = file.name.toLowerCase()
  if (name.endsWith('.xls')) return 'El formato .xls no es compatible. Guarda el archivo como Excel moderno (.xlsx).'
  if (!name.endsWith('.xlsx') && !name.endsWith('.xlsm')) return 'Formato no soportado. Selecciona un archivo .xlsx.'
  if (file.size === 0) return 'El archivo está vacío.'
  if (file.size > MAX_EXCEL_BYTES) return 'El archivo supera el tamaño máximo de 5 MB.'
  return null
}

/** Lee un archivo como data URL (base64), el formato que esperan las mutaciones de importación. */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })
}
