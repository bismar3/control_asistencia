import { gql } from '@apollo/client'
import { ACTIVIDAD_FIELDS } from './fragments'

/** RF-10: historial de actividades del módulo activo con filtros. */
export const HISTORIAL_ACTIVIDADES = gql`
  query HistorialActividades($busqueda: String, $fecha: Date, $accion: String, $limite: Int) {
    historialActividades(busqueda: $busqueda, fecha: $fecha, accion: $accion, limite: $limite) {
      ...ActividadFields
    }
  }
  ${ACTIVIDAD_FIELDS}
`
