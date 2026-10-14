import { useCallback, useRef, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { VALIDAR_EXCEL_ESTUDIANTES, VALIDAR_EXCEL_FECHAS } from '../../../graphql/importacion'
import { parseJSON } from '../../../lib/attendance'
import { getErrorMessage } from '../../../lib/errors'
import { readFileAsDataURL, validateExcelFile } from '../../../lib/files'

const EMPTY = { file: null, base64: null, result: null, error: null, validating: false }

const CONFIG = {
  estudiantes: { mutation: VALIDAR_EXCEL_ESTUDIANTES, field: 'validarExcelEstudiantes' },
  fechas: { mutation: VALIDAR_EXCEL_FECHAS, field: 'validarExcelFechas' },
}

/**
 * Lee el Excel en el navegador, lo envía al backend para validarlo y guarda
 * el resultado (vista previa + errores por fila) junto con el base64 para importarlo después.
 */
export function useExcelValidation(kind) {
  const { mutation, field } = CONFIG[kind]
  const [state, setState] = useState(EMPTY)
  const [validar] = useMutation(mutation)
  const requestId = useRef(0)

  const select = useCallback(
    async (file) => {
      requestId.current += 1
      const current = requestId.current
      const problem = validateExcelFile(file)
      if (problem) {
        setState({ ...EMPTY, error: problem })
        return
      }
      setState({ ...EMPTY, file, validating: true })
      try {
        const base64 = await readFileAsDataURL(file)
        const { data } = await validar({ variables: { archivoBase64: base64 } })
        if (current !== requestId.current) return
        const raw = data?.[field]
        setState({
          file,
          base64,
          result: raw ? { ...raw, preview: parseJSON(raw.datosPreview, []) } : null,
          error: raw ? null : 'El servidor no devolvió un resultado de validación.',
          validating: false,
        })
      } catch (err) {
        if (current !== requestId.current) return
        setState({ ...EMPTY, file, error: getErrorMessage(err) })
      }
    },
    [validar, field],
  )

  const reset = useCallback(() => {
    requestId.current += 1
    setState(EMPTY)
  }, [])

  return { ...state, select, reset, valid: Boolean(state.result?.valido) }
}
