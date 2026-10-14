import { gql } from '@apollo/client'
import { ASISTENCIA_FIELDS, ESTUDIANTE_FIELDS } from './fragments'

/** RF-05: historial personal del estudiante en el módulo activo. */
export const MI_HISTORIAL = gql`
  query MiHistorial($estudianteId: Int!) {
    miHistorialAsistencia(estudianteId: $estudianteId) {
      totalClases
      totalAsistencias
      totalFaltas
      porcentajeAsistencia
      puedeMarcarHoy
      claseHoyId
      historial {
        claseId
        claseNombre
        fechaProgramada
        horaInicio
        horaFin
        estado
        horaMarca
        esHoy
        puedeMarcar
      }
    }
  }
`

/** RF-03: el estudiante marca su asistencia (solo el día de clase). */
export const MARCAR_ASISTENCIA = gql`
  mutation MarcarAsistencia($estudianteId: Int!) {
    marcarAsistencia(estudianteId: $estudianteId) {
      success
      message
      asistencia {
        id
        estado
        fechaHoraMarca
        horaMarcaFormateada
      }
    }
  }
`

/** Lista completa de una fecha (el backend crea los registros faltantes como FALTA). */
export const ASISTENCIAS_POR_CLASE = gql`
  query AsistenciasPorClase($claseId: Int!) {
    asistenciasPorClase(claseId: $claseId) {
      ...AsistenciaFields
      estudiante {
        ...EstudianteFields
      }
    }
  }
  ${ASISTENCIA_FIELDS}
  ${ESTUDIANTE_FIELDS}
`

/** RF-08: matriz estudiantes × clases del módulo. */
export const REPORTE_GENERAL = gql`
  query ReporteGeneral($moduloId: Int) {
    reporteGeneralAsistencias(moduloId: $moduloId) {
      estudiante {
        ...EstudianteFields
      }
      asistenciasPorClase
      totalPresentes
      totalFaltas
      porcentaje
    }
  }
  ${ESTUDIANTE_FIELDS}
`

/** RF-07: modificación administrativa (queda auditada con el correo del administrador). */
export const MODIFICAR_ASISTENCIA = gql`
  mutation ModificarAsistencia(
    $claseId: Int!
    $estudianteId: Int!
    $nuevoEstado: String!
    $observacion: String
    $adminEmail: String
  ) {
    modificarAsistenciaAdmin(
      claseId: $claseId
      estudianteId: $estudianteId
      nuevoEstado: $nuevoEstado
      observacion: $observacion
      adminEmail: $adminEmail
    ) {
      success
      message
      asistencia {
        ...AsistenciaFields
      }
    }
  }
  ${ASISTENCIA_FIELDS}
`
