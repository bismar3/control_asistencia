import { gql } from '@apollo/client'

const RESULTADO_VALIDACION = `
  valido
  totalFilas
  totalValidos
  totalErrores
  errores {
    fila
    error
    datos
  }
  datosPreview
`

/** RF-11 / RF-16: valida el Excel de estudiantes y devuelve vista previa y errores. */
export const VALIDAR_EXCEL_ESTUDIANTES = gql`
  mutation ValidarExcelEstudiantes($archivoBase64: String!) {
    validarExcelEstudiantes(archivoBase64: $archivoBase64) {
      ${RESULTADO_VALIDACION}
    }
  }
`

/** RF-12 / RF-16: valida el Excel de fechas y horarios. */
export const VALIDAR_EXCEL_FECHAS = gql`
  mutation ValidarExcelFechas($archivoBase64: String!) {
    validarExcelFechas(archivoBase64: $archivoBase64) {
      ${RESULTADO_VALIDACION}
    }
  }
`

export const IMPORTAR_ESTUDIANTES = gql`
  mutation ImportarEstudiantesExcel(
    $moduloId: Int!
    $archivoBase64: String!
    $nombreArchivo: String
    $adminEmail: String
  ) {
    importarEstudiantesExcel(
      moduloId: $moduloId
      archivoBase64: $archivoBase64
      nombreArchivo: $nombreArchivo
      adminEmail: $adminEmail
    ) {
      success
      message
      totalImportados
    }
  }
`

export const IMPORTAR_FECHAS = gql`
  mutation ImportarFechasExcel($moduloId: Int!, $archivoBase64: String!, $nombreArchivo: String, $adminEmail: String) {
    importarFechasExcel(
      moduloId: $moduloId
      archivoBase64: $archivoBase64
      nombreArchivo: $nombreArchivo
      adminEmail: $adminEmail
    ) {
      success
      message
      totalClases
    }
  }
`

export const HISTORIAL_IMPORTACIONES = gql`
  query HistorialImportaciones($moduloId: Int) {
    historialImportaciones(moduloId: $moduloId) {
      id
      nombreOriginal
      tipo
      fechaSubida
      totalProcesados
      totalExitosos
      totalFallidos
      usuario {
        id
        email
      }
    }
  }
`
