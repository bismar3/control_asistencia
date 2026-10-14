import graphene
from django.utils import timezone
from graphene_django import DjangoObjectType
from .models import HistorialActividad


class HistorialActividadType(DjangoObjectType):
    usuario_email = graphene.String()
    fecha_hora_formateada = graphene.String()
    tipo_accion_texto = graphene.String()

    class Meta:
        model = HistorialActividad
        fields = (
            'id', 'usuario', 'modulo', 'accion', 'descripcion',
            'registro_afectado', 'valor_anterior', 'valor_nuevo',
            'detalles', 'ip_origen', 'fecha_hora'
        )

    def resolve_usuario_email(self, info):
        return self.usuario.email if self.usuario else "Sistema"

    def resolve_fecha_hora_formateada(self, info):
        return timezone.localtime(self.fecha_hora).strftime("%d/%m/%Y %H:%M:%S")

    def resolve_tipo_accion_texto(self, info):
        return self.get_accion_display()
