import graphene
from django.utils import timezone
from graphene_django import DjangoObjectType
from .models import Asistencia
from apps.academico.types import ClaseType
from apps.usuarios.types import EstudianteType, UsuarioType


class AsistenciaType(DjangoObjectType):
    hora_marca_formateada = graphene.String()

    class Meta:
        model = Asistencia
        fields = (
            'id', 'clase', 'estudiante', 'fecha_hora_marca',
            'estado', 'observacion', 'modificado_por', 'fecha_modificacion'
        )

    def resolve_hora_marca_formateada(self, info):
        if self.fecha_hora_marca:
            return timezone.localtime(self.fecha_hora_marca).strftime("%H:%M:%S")
        return ""


class ItemHistorialEstudianteType(graphene.ObjectType):
    clase_id = graphene.Int()
    clase_nombre = graphene.String()
    fecha_programada = graphene.Date()
    hora_inicio = graphene.Time()
    hora_fin = graphene.Time()
    estado = graphene.String()
    hora_marca = graphene.String()
    es_hoy = graphene.Boolean()
    puede_marcar = graphene.Boolean()


class ResumenAsistenciaEstudianteType(graphene.ObjectType):
    estudiante = graphene.Field(EstudianteType)
    total_clases = graphene.Int()
    total_asistencias = graphene.Int()
    total_faltas = graphene.Int()
    porcentaje_asistencia = graphene.Float()
    puede_marcar_hoy = graphene.Boolean()
    clase_hoy_id = graphene.Int()
    historial = graphene.List(ItemHistorialEstudianteType)


class FilaReporteGeneralType(graphene.ObjectType):
    estudiante = graphene.Field(EstudianteType)
    asistencias_por_clase = graphene.JSONString()
    total_presentes = graphene.Int()
    total_faltas = graphene.Int()
    porcentaje = graphene.Float()
