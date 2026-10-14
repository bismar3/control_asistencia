import graphene
from django.db.models import Q
from .models import HistorialActividad
from .types import HistorialActividadType
from apps.academico.models import Modulo


class Query(graphene.ObjectType):
    historial_actividades = graphene.List(
        HistorialActividadType,
        modulo_id=graphene.Int(),
        busqueda=graphene.String(),
        fecha=graphene.Date(),
        accion=graphene.String(),
        limite=graphene.Int(default_value=100)
    )

    def resolve_historial_actividades(self, info, modulo_id=None, busqueda=None, fecha=None, accion=None, limite=100):
        queryset = HistorialActividad.objects.select_related('usuario', 'modulo').all()

        if modulo_id:
            queryset = queryset.filter(modulo_id=modulo_id)
        else:
            modulo_activo = Modulo.objects.filter(es_activo=True).first()
            if modulo_activo:
                queryset = queryset.filter(modulo=modulo_activo)

        if busqueda:
            term = busqueda.strip()
            queryset = queryset.filter(
                Q(registro_afectado__icontains=term) |
                Q(descripcion__icontains=term) |
                Q(usuario__email__icontains=term)
            )

        if fecha:
            queryset = queryset.filter(fecha_hora__date=fecha)

        if accion:
            queryset = queryset.filter(accion=accion.strip().upper())

        return queryset.order_by('-fecha_hora')[:limite]
