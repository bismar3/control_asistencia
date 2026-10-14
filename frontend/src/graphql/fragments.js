import { gql } from '@apollo/client'

export const ESTUDIANTE_FIELDS = gql`
  fragment EstudianteFields on EstudianteType {
    id
    nroRegistro
    nombre
    apellidoPaterno
    apellidoMaterno
    nombreCompleto
    email
    celular
    estado
  }
`

export const MODULO_FIELDS = gql`
  fragment ModuloFields on ModuloType {
    id
    nombre
    cantidadClases
    fechaInicio
    fechaFin
    esActivo
    createdAt
    totalEstudiantes
    totalClases
  }
`

export const CLASE_FIELDS = gql`
  fragment ClaseFields on ClaseType {
    id
    nombre
    fechaProgramada
    horaInicio
    horaFin
    orden
    esHoy
    totalPresentes
    totalFaltas
  }
`

export const ASISTENCIA_FIELDS = gql`
  fragment AsistenciaFields on AsistenciaType {
    id
    estado
    observacion
    fechaHoraMarca
    horaMarcaFormateada
    fechaModificacion
    modificadoPor {
      id
      email
    }
  }
`

export const ACTIVIDAD_FIELDS = gql`
  fragment ActividadFields on HistorialActividadType {
    id
    accion
    tipoAccionTexto
    descripcion
    registroAfectado
    valorAnterior
    valorNuevo
    detalles
    fechaHora
    usuarioEmail
  }
`
