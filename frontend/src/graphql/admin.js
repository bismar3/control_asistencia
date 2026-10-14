import { gql } from '@apollo/client'

export const ADMINISTRADORES = gql`
  query Administradores {
    administradores {
      id
      nombreCompleto
      email
      createdAt
    }
  }
`

export const CREAR_ADMINISTRADOR = gql`
  mutation CrearAdministrador($email: String!, $password: String!, $nombreCompleto: String!) {
    crearAdministrador(email: $email, password: $password, nombreCompleto: $nombreCompleto) {
      success
      message
      administrador {
        id
        nombreCompleto
        email
        createdAt
      }
    }
  }
`

export const EDITAR_ADMINISTRADOR = gql`
  mutation EditarAdministrador($id: Int!, $nombreCompleto: String, $email: String) {
    editarAdministrador(id: $id, nombreCompleto: $nombreCompleto, email: $email) {
      success
      message
      administrador {
        id
        nombreCompleto
        email
        createdAt
      }
    }
  }
`

export const ELIMINAR_ADMINISTRADOR = gql`
  mutation EliminarAdministrador($id: Int!) {
    eliminarAdministrador(id: $id) {
      success
      message
    }
  }
`
