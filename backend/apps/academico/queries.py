import graphene
from django.utils import timezone
from .models import Modulo, Clase, Inscripcion
from .types import ModuloType, ClaseType, InscripcionType
from apps.usuarios.types import EstudianteType


class Query(graphene.ObjectType):
    modulo_activo = graphene.Field(
        ModuloType,
        description="Retorna el único módulo académico activo actualmente (RN-01)"
    )
    modulos = graphene.List(
        ModuloType,
        description="Lista de todos los módulos (activos e históricos)"
    )
    modulo = graphene.Field(ModuloType, id=graphene.Int(required=True))
    clases_modulo = graphene.List(
        ClaseType,
        modulo_id=graphene.Int(),
        description="Lista de clases del módulo especificado (o del activo si no se indica)"
    )
    clase_hoy = graphene.Field(
        ClaseType,
        description="Clase programada para la fecha actual en el módulo activo (si existe)"
    )
    estudiantes_modulo_activo = graphene.List(
        EstudianteType,
        busqueda=graphene.String()
    )

    def resolve_modulo_activo(self, info):
        return Modulo.objects.filter(es_activo=True).first()

    def resolve_modulos(self, info):
        return Modulo.objects.all().order_by('-es_activo', '-created_at')

    def resolve_modulo(self, info, id):
        return Modulo.objects.filter(id=id).first()

    def resolve_clases_modulo(self, info, modulo_id=None):
        if modulo_id:
            return Clase.objects.filter(modulo_id=modulo_id).order_by('fecha_programada', 'orden')
        # Si no se envía id, toma las del módulo activo
        modulo_activo = Modulo.objects.filter(es_activo=True).first()
        if modulo_activo:
            return Clase.objects.filter(modulo=modulo_activo).order_by('fecha_programada', 'orden')
        return []

    def resolve_clase_hoy(self, info):
        hoy = timezone.localdate()
        modulo_activo = Modulo.objects.filter(es_activo=True).first()
        if not modulo_activo:
            return None
        return Clase.objects.filter(modulo=modulo_activo, fecha_programada=hoy).first()

    def resolve_estudiantes_modulo_activo(self, info, busqueda=None):
        modulo_activo = Modulo.objects.filter(es_activo=True).first()
        if not modulo_activo:
            return []

        inscripciones = Inscripcion.objects.filter(
            modulo=modulo_activo,
            es_activo=True
        ).select_related('estudiante', 'estudiante__usuario')

        estudiantes = [ins.estudiante for ins in inscripciones]
        if busqueda:
            term = busqueda.strip().lower()
            estudiantes = [
                e for e in estudiantes
                if term in e.nombre.lower()
                or term in e.apellido_paterno.lower()
                or term in e.apellido_materno.lower()
                or term in e.nro_registro.lower()
            ]
        return estudiantes
