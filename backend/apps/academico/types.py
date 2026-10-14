import graphene
from django.utils import timezone
from graphene_django import DjangoObjectType
from .models import Modulo, Clase, Inscripcion


class ModuloType(DjangoObjectType):
    total_estudiantes = graphene.Int()
    total_clases = graphene.Int()

    class Meta:
        model = Modulo
        fields = (
            'id', 'nombre', 'cantidad_clases', 'fecha_inicio',
            'fecha_fin', 'es_activo', 'created_at'
        )

    def resolve_total_estudiantes(self, info):
        return self.inscripciones.filter(es_activo=True).count()

    def resolve_total_clases(self, info):
        return self.clases.count()


class ClaseType(DjangoObjectType):
    es_hoy = graphene.Boolean()
    total_presentes = graphene.Int()
    total_faltas = graphene.Int()

    class Meta:
        model = Clase
        fields = (
            'id', 'modulo', 'nombre', 'fecha_programada',
            'hora_inicio', 'hora_fin', 'orden', 'created_at'
        )

    def resolve_es_hoy(self, info):
        return self.fecha_programada == timezone.localdate()

    def resolve_total_presentes(self, info):
        return self.asistencias.filter(estado='PRESENTE').count()

    def resolve_total_faltas(self, info):
        return self.asistencias.filter(estado='FALTA').count()


class InscripcionType(DjangoObjectType):
    class Meta:
        model = Inscripcion
        fields = ('id', 'modulo', 'estudiante', 'fecha_inscripcion', 'es_activo')
