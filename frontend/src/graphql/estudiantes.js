import { gql } from '@apollo/client'
import { ESTUDIANTE_FIELDS } from './fragments'

/** RF-06: estudiantes inscritos en el módulo activo (búsqueda por nombre o registro). */
export const ESTUDIANTES_MODULO_ACTIVO = gql`
  query EstudiantesModuloActivo($busqueda: String) {
    estudiantesModuloActivo(busqueda: $busqueda) {
      ...EstudianteFields
    }
  }
  ${ESTUDIANTE_FIELDS}
`

/** Verificación ligera de la sesión del estudiante frente al módulo activo. */
export const VERIFICAR_INSCRIPCION = gql`
  query VerificarInscripcion($busqueda: String) {
    moduloActivo {
      id
      nombre
    }
    estudiantesModuloActivo(busqueda: $busqueda) {
      id
    }
  }
`

export const ESTUDIANTE_POR_REGISTRO = gql`
  query EstudiantePorRegistro($nroRegistro: String) {
    estudiante(nroRegistro: $nroRegistro) {
      ...EstudianteFields
    }
  }
  ${ESTUDIANTE_FIELDS}
`

export const CREAR_ESTUDIANTE = gql`
  mutation CrearEstudiante(
    $nroRegistro: String!
    $nombre: String!
    $apellidoPaterno: String
    $apellidoMaterno: String
    $email: String!
    $celular: String
  ) {
    crearEstudiante(
      nroRegistro: $nroRegistro
      nombre: $nombre
      apellidoPaterno: $apellidoPaterno
      apellidoMaterno: $apellidoMaterno
      email: $email
      celular: $celular
    ) {
      success
      message
      estudiante {
        ...EstudianteFields
      }
    }
  }
  ${ESTUDIANTE_FIELDS}
`

export const EDITAR_ESTUDIANTE = gql`
  mutation EditarEstudiante(
    $id: Int!
    $nroRegistro: String
    $nombre: String
    $apellidoPaterno: String
    $apellidoMaterno: String
    $email: String
    $celular: String
  ) {
    editarEstudiante(
      id: $id
      nroRegistro: $nroRegistro
      nombre: $nombre
      apellidoPaterno: $apellidoPaterno
      apellidoMaterno: $apellidoMaterno
      email: $email
      celular: $celular
    ) {
      success
      message
      estudiante {
        ...EstudianteFields
      }
    }
  }
  ${ESTUDIANTE_FIELDS}
`

export const INSCRIBIR_ESTUDIANTE = gql`
  mutation InscribirEstudiante($moduloId: Int!, $estudianteId: Int!) {
    inscribirEstudiante(moduloId: $moduloId, estudianteId: $estudianteId) {
      success
      message
    }
  }
`

export const DESINSCRIBIR_ESTUDIANTE = gql`
  mutation DesinscribirEstudiante($moduloId: Int!, $estudianteId: Int!) {
    desinscribirEstudiante(moduloId: $moduloId, estudianteId: $estudianteId) {
      success
      message
    }
  }
`
