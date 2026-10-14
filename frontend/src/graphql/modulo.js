import { gql } from '@apollo/client'
import { CLASE_FIELDS, MODULO_FIELDS } from './fragments'

export const MODULO_ACTIVO = gql`
  query ModuloActivo {
    moduloActivo {
      ...ModuloFields
    }
  }
  ${MODULO_FIELDS}
`

/** Sin moduloId el backend devuelve las clases del módulo activo. */
export const CLASES_MODULO = gql`
  query ClasesModulo($moduloId: Int) {
    clasesModulo(moduloId: $moduloId) {
      ...ClaseFields
    }
  }
  ${CLASE_FIELDS}
`

export const CREAR_MODULO = gql`
  mutation CrearModulo($nombre: String!, $activar: Boolean) {
    crearModulo(nombre: $nombre, activar: $activar) {
      success
      message
      modulo {
        ...ModuloFields
      }
    }
  }
  ${MODULO_FIELDS}
`

export const EDITAR_MODULO = gql`
  mutation EditarModulo($id: Int!, $nombre: String) {
    editarModulo(id: $id, nombre: $nombre) {
      success
      message
      modulo {
        ...ModuloFields
      }
    }
  }
  ${MODULO_FIELDS}
`

export const ACTIVAR_MODULO = gql`
  mutation ActivarModulo($moduloId: Int!) {
    activarModulo(moduloId: $moduloId) {
      success
      message
      modulo {
        ...ModuloFields
      }
    }
  }
  ${MODULO_FIELDS}
`

export const ELIMINAR_MODULO = gql`
  mutation EliminarModulo($id: Int!) {
    eliminarModulo(id: $id) {
      success
      message
    }
  }
`

export const CREAR_CLASE = gql`
  mutation CrearClase(
    $moduloId: Int!
    $fechaProgramada: Date!
    $horaInicio: Time
    $horaFin: Time
    $nombre: String
    $orden: Int
  ) {
    crearClase(
      moduloId: $moduloId
      fechaProgramada: $fechaProgramada
      horaInicio: $horaInicio
      horaFin: $horaFin
      nombre: $nombre
      orden: $orden
    ) {
      success
      message
      clase {
        ...ClaseFields
      }
    }
  }
  ${CLASE_FIELDS}
`

export const EDITAR_CLASE = gql`
  mutation EditarClase($id: Int!, $fechaProgramada: Date, $horaInicio: Time, $horaFin: Time, $nombre: String) {
    editarClase(id: $id, fechaProgramada: $fechaProgramada, horaInicio: $horaInicio, horaFin: $horaFin, nombre: $nombre) {
      success
      message
      clase {
        ...ClaseFields
      }
    }
  }
  ${CLASE_FIELDS}
`

export const ELIMINAR_CLASE = gql`
  mutation EliminarClase($id: Int!) {
    eliminarClase(id: $id) {
      success
      message
    }
  }
`
