import graphene
from django.utils import timezone
from graphene_django import DjangoObjectType
from .models import ImportacionExcel


class ImportacionExcelType(DjangoObjectType):
    fecha_subida_formateada = graphene.String()

    class Meta:
        model = ImportacionExcel
        fields = (
            'id', 'nombre_original', 'tipo', 'modulo',
            'usuario', 'fecha_subida', 'total_procesados',
            'total_exitosos', 'total_fallidos', 'resumen_errores'
        )

    def resolve_fecha_subida_formateada(self, info):
        return timezone.localtime(self.fecha_subida).strftime("%d/%m/%Y %H:%M:%S")


class ItemErrorImportacionType(graphene.ObjectType):
    fila = graphene.Int()
    error = graphene.String()
    datos = graphene.String()


class ResultadoValidacionExcelType(graphene.ObjectType):
    valido = graphene.Boolean()
    total_filas = graphene.Int()
    total_validos = graphene.Int()
    total_errores = graphene.Int()
    errores = graphene.List(ItemErrorImportacionType)
    datos_preview = graphene.JSONString()

