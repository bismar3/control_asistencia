import graphene
from django.db.models import Q
from .models import Usuario, Estudiante, Administrador
from .types import UsuarioType, EstudianteType, AdministradorType


class Query(graphene.ObjectType):
    usuarios = graphene.List(UsuarioType)
    estudiantes = graphene.List(
        EstudianteType,
        busqueda=graphene.String(description="Buscar por nombre o número de registro")
    )
    estudiante = graphene.Field(
        EstudianteType,
        id=graphene.Int(),
        nro_registro=graphene.String(),
        email=graphene.String()
    )
    administradores = graphene.List(AdministradorType)

    def resolve_usuarios(self, info):
        return Usuario.objects.all()

    def resolve_estudiantes(self, info, busqueda=None):
        queryset = Estudiante.objects.select_related('usuario').all()
        if busqueda:
            termino = busqueda.strip()
            queryset = queryset.filter(
                Q(nro_registro__icontains=termino) |
                Q(nombre__icontains=termino) |
                Q(apellido_paterno__icontains=termino) |
                Q(apellido_materno__icontains=termino) |
                Q(usuario__email__icontains=termino)
            )
        return queryset

    def resolve_estudiante(self, info, id=None, nro_registro=None, email=None):
        queryset = Estudiante.objects.select_related('usuario')
        if id:
            return queryset.filter(id=id).first()
        if nro_registro:
            return queryset.filter(nro_registro=nro_registro.strip()).first()
        if email:
            return queryset.filter(usuario__email__iexact=email.strip()).first()
        return None

    def resolve_administradores(self, info):
        return Administrador.objects.select_related('usuario').all()
