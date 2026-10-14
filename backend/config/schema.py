import graphene
from apps.usuarios.queries import Query as UsuariosQuery
from apps.usuarios.mutations import Mutation as UsuariosMutation
from apps.academico.queries import Query as AcademicoQuery
from apps.academico.mutations import Mutation as AcademicoMutation
from apps.asistencias.queries import Query as AsistenciasQuery
from apps.asistencias.mutations import Mutation as AsistenciasMutation
from apps.auditoria.queries import Query as AuditoriaQuery
from apps.auditoria.mutations import Mutation as AuditoriaMutation
from apps.importaciones.queries import Query as ImportacionesQuery
from apps.importaciones.mutations import Mutation as ImportacionesMutation


class Query(
    UsuariosQuery,
    AcademicoQuery,
    AsistenciasQuery,
    AuditoriaQuery,
    ImportacionesQuery,
    graphene.ObjectType
):
    version = graphene.String(default_value="1.0.0")


class Mutation(
    UsuariosMutation,
    AcademicoMutation,
    AsistenciasMutation,
    AuditoriaMutation,
    ImportacionesMutation,
    graphene.ObjectType
):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
