import graphene
from .models import ImportacionExcel
from .types import ImportacionExcelType


class Query(graphene.ObjectType):
    historial_importaciones = graphene.List(
        ImportacionExcelType,
        modulo_id=graphene.Int()
    )

    def resolve_historial_importaciones(self, info, modulo_id=None):
        queryset = ImportacionExcel.objects.select_related('modulo', 'usuario').all()
        if modulo_id:
            queryset = queryset.filter(modulo_id=modulo_id)
        return queryset.order_by('-fecha_subida')
