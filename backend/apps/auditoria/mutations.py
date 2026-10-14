import graphene
from .models import HistorialActividad, TipoAccionAuditoria
from .types import HistorialActividadType


class RegistrarActividad(graphene.Mutation):
    class Arguments:
        accion = graphene.String(required=True)
        descripcion = graphene.String(required=True)
        registro_afectado = graphene.String(required=False, default_value="")

    success = graphene.Boolean()
    actividad = graphene.Field(HistorialActividadType)

    @classmethod
    def mutate(cls, root, info, accion, descripcion, registro_afectado=""):
        actividad = HistorialActividad.objects.create(
            accion=TipoAccionAuditoria.OTRO,
            descripcion=descripcion,
            registro_afectado=registro_afectado
        )
        return RegistrarActividad(success=True, actividad=actividad)


class Mutation(graphene.ObjectType):
    registrar_actividad = RegistrarActividad.Field()
