import { gql } from '@apollo/client'
import { ESTUDIANTE_FIELDS } from './fragments'

/** RF-01: ingreso del estudiante con correo o número de registro. */
export const LOGIN_ESTUDIANTE = gql`
  mutation LoginEstudiante($identificador: String!) {
    loginEstudiante(identificador: $identificador) {
      success
      message
      rol
      usuario {
        id
        email
        rol
      }
      estudiante {
        ...EstudianteFields
      }
    }
  }
  ${ESTUDIANTE_FIELDS}
`

/** RF-02: ingreso del administrador con credenciales propias. */
export const LOGIN_ADMIN = gql`
  mutation LoginAdmin($email: String!, $password: String!) {
    loginAdmin(email: $email, password: $password) {
      success
      message
      rol
      usuario {
        id
        email
        rol
        isStaff
      }
      administrador {
        id
        nombreCompleto
        email
      }
    }
  }
`

export const CAMBIAR_PASSWORD = gql`
  mutation CambiarPassword($email: String!, $passwordActual: String!, $passwordNuevo: String!) {
    cambiarPassword(email: $email, passwordActual: $passwordActual, passwordNuevo: $passwordNuevo) {
      success
      message
    }
  }
`
