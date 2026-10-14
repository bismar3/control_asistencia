import graphene
from graphene_django import DjangoObjectType
from .models import Usuario, Estudiante, Administrador


class UsuarioType(DjangoObjectType):
    class Meta:
        model = Usuario
        fields = ('id', 'email', 'rol', 'is_active', 'is_staff', 'date_joined')


class EstudianteType(DjangoObjectType):
    nombre_completo = graphene.String()
    email = graphene.String()

    class Meta:
        model = Estudiante
        fields = (
            'id', 'nro_registro', 'nombre', 'apellido_paterno',
            'apellido_materno', 'celular', 'estado', 'created_at', 'usuario'
        )

    def resolve_nombre_completo(self, info):
        return self.nombre_completo

    def resolve_email(self, info):
        return self.usuario.email if self.usuario else ""


class AdministradorType(DjangoObjectType):
    email = graphene.String()

    class Meta:
        model = Administrador
        fields = ('id', 'nombre_completo', 'created_at', 'usuario')

    def resolve_email(self, info):
        return self.usuario.email if self.usuario else ""


class AuthPayloadType(graphene.ObjectType):
    success = graphene.Boolean(required=True)
    message = graphene.String(required=True)
    rol = graphene.String()
    usuario = graphene.Field(UsuarioType)
    estudiante = graphene.Field(EstudianteType)
    administrador = graphene.Field(AdministradorType)
