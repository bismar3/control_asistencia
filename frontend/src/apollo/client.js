import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { GRAPHQL_URL } from '../config'

/**
 * Cliente Apollo conectado al endpoint GraphQL de Django (graphene-django).
 * En desarrollo GRAPHQL_URL es relativo (/graphql/) y lo resuelve el proxy de Vite.
 */
export const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL }),
  cache: new InMemoryCache({
    typePolicies: {
      // Tipos sin `id`: se fusionan en lugar de reemplazarse para evitar advertencias de caché.
      ResumenAsistenciaEstudianteType: { merge: true },
      ResultadoValidacionExcelType: { merge: true },
    },
  }),
  defaultOptions: {
    watchQuery: {
      // Muestra la caché al instante y actualiza en segundo plano.
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    },
  },
})
