import graphene
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import Usuario, Estudiante, Administrador, RolUsuario
from .types import EstudianteType, AdministradorType, AuthPayloadType
from apps.academico.models import Modulo, Inscripcion
from apps.auditoria.models import HistorialActividad, TipoAccionAuditoria


class LoginEstudiante(graphene.Mutation):
    class Arguments:
        identificador = graphene.String(
            required=True,
            description="Correo electrónico o número de registro del estudiante"
        )

    Output = AuthPayloadType

    @classmethod
    def mutate(cls, root, info, identificador):
        term = identificador.strip()

        # 1. Buscar al estudiante por número de registro o por correo
        estudiante = Estudiante.objects.select_related('usuario').filter(
            Q(nro_registro__iexact=term) | Q(usuario__email__iexact=term)
        ).first()

        if not estudiante:
            return AuthPayloadType(
                success=False,
                message="No se encontró ningún estudiante con los datos ingresados.",
                rol=None,
                usuario=None,
                estudiante=None
            )

        # 2. Validar que exista un módulo activo (RN-01)
        modulo_activo = Modulo.objects.filter(es_activo=True).first()
        if not modulo_activo:
            return AuthPayloadType(
                success=False,
                message="Actualmente no hay ningún módulo académico activo en el sistema.",
                rol=None,
                usuario=None,
                estudiante=None
            )

        # 3. Validar que el estudiante pertenezca a la lista de estudiantes del módulo activo (RF-01)
        inscripcion = Inscripcion.objects.filter(
            modulo=modulo_activo,
            estudiante=estudiante,
            es_activo=True
        ).first()

        if not inscripcion:
            return AuthPayloadType(
                success=False,
                message=f"El estudiante {estudiante.nombre_completo} no está matriculado en el módulo activo ({modulo_activo.nombre}).",
                rol=None,
                usuario=None,
                estudiante=None
            )

        # Registrar en auditoría
        HistorialActividad.objects.create(
            usuario=estudiante.usuario,
            modulo=modulo_activo,
            accion=TipoAccionAuditoria.LOGIN,
            descripcion=f"Ingreso de estudiante al sistema: {estudiante.nombre_completo}",
            registro_afectado=f"Estudiante ID {estudiante.id} (Reg: {estudiante.nro_registro})"
        )

        return AuthPayloadType(
            success=True,
            message=f"Bienvenido, {estudiante.nombre_completo}",
            rol=RolUsuario.ESTUDIANTE,
            usuario=estudiante.usuario,
            estudiante=estudiante,
            administrador=None
        )


class LoginAdmin(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    Output = AuthPayloadType

    @classmethod
    def mutate(cls, root, info, email, password):
        email_clean = email.strip().lower()
        user = authenticate(username=email_clean, password=password)

        if not user:
            return AuthPayloadType(
                success=False,
                message="Credenciales incorrectas. Verifique su correo y contraseña.",
                rol=None,
                usuario=None,
                estudiante=None,
                administrador=None
            )

        if user.rol != RolUsuario.ADMIN and not user.is_staff:
            return AuthPayloadType(
                success=False,
                message="Acceso restringido: Este usuario no cuenta con privilegios de Administrador.",
                rol=None,
                usuario=None,
                estudiante=None,
                administrador=None
            )

        admin_perfil = Administrador.objects.filter(usuario=user).first()
        modulo_activo = Modulo.objects.filter(es_activo=True).first()

        HistorialActividad.objects.create(
            usuario=user,
            modulo=modulo_activo,
            accion=TipoAccionAuditoria.LOGIN,
            descripcion=f"Inicio de sesión de administrador: {user.email}",
            registro_afectado=f"Usuario ID {user.id}"
        )

        return AuthPayloadType(
            success=True,
            message="Acceso de administrador concedido.",
            rol=RolUsuario.ADMIN,
            usuario=user,
            estudiante=None,
            administrador=admin_perfil
        )


class CrearEstudiante(graphene.Mutation):
    class Arguments:
        nro_registro = graphene.String(required=True)
        nombre = graphene.String(required=True)
        apellido_paterno = graphene.String(required=False, default_value="")
        apellido_materno = graphene.String(required=False, default_value="")
        email = graphene.String(required=True)
        celular = graphene.String(required=False, default_value="")

    success = graphene.Boolean()
    message = graphene.String()
    estudiante = graphene.Field(EstudianteType)

    @classmethod
    def mutate(cls, root, info, nro_registro, nombre, email, apellido_paterno="", apellido_materno="", celular=""):
        nro_reg_clean = nro_registro.strip()
        email_clean = email.strip().lower()

        if Estudiante.objects.filter(nro_registro=nro_reg_clean).exists():
            return CrearEstudiante(
                success=False,
                message=f"El número de registro {nro_reg_clean} ya se encuentra registrado.",
                estudiante=None
            )

        user, _ = Usuario.objects.get_or_create(
            email=email_clean,
            defaults={'rol': RolUsuario.ESTUDIANTE}
        )

        estudiante = Estudiante.objects.create(
            usuario=user,
            nro_registro=nro_reg_clean,
            nombre=nombre.strip(),
            apellido_paterno=apellido_paterno.strip(),
            apellido_materno=apellido_materno.strip(),
            celular=celular.strip(),
            estado=True
        )

        return CrearEstudiante(
            success=True,
            message="Estudiante registrado exitosamente.",
            estudiante=estudiante
        )


class EditarEstudiante(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        nombre = graphene.String(required=False)
        apellido_paterno = graphene.String(required=False)
        apellido_materno = graphene.String(required=False)
        celular = graphene.String(required=False)
        nro_registro = graphene.String(required=False)
        email = graphene.String(required=False)
        estado = graphene.Boolean(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    estudiante = graphene.Field(EstudianteType)

    @classmethod
    def mutate(cls, root, info, id, **kwargs):
        estudiante = Estudiante.objects.filter(id=id).first()
        if not estudiante:
            return EditarEstudiante(success=False, message="Estudiante no encontrado.", estudiante=None)

        if 'nro_registro' in kwargs and kwargs['nro_registro']:
            nuevo_nro = kwargs['nro_registro'].strip()
            if Estudiante.objects.filter(nro_registro=nuevo_nro).exclude(id=id).exists():
                return EditarEstudiante(success=False, message=f"El número de registro {nuevo_nro} ya está en uso.", estudiante=None)
            estudiante.nro_registro = nuevo_nro

        if 'nombre' in kwargs and kwargs['nombre'] is not None:
            estudiante.nombre = kwargs['nombre'].strip()
        if 'apellido_paterno' in kwargs and kwargs['apellido_paterno'] is not None:
            estudiante.apellido_paterno = kwargs['apellido_paterno'].strip()
        if 'apellido_materno' in kwargs and kwargs['apellido_materno'] is not None:
            estudiante.apellido_materno = kwargs['apellido_materno'].strip()
        if 'celular' in kwargs and kwargs['celular'] is not None:
            estudiante.celular = kwargs['celular'].strip()
        if 'estado' in kwargs and kwargs['estado'] is not None:
            estudiante.estado = kwargs['estado']

        if 'email' in kwargs and kwargs['email'] is not None:
            nuevo_email = kwargs['email'].strip().lower()
            if Usuario.objects.filter(email=nuevo_email).exclude(id=estudiante.usuario_id).exists():
                return EditarEstudiante(success=False, message=f"El correo {nuevo_email} ya pertenece a otro usuario.", estudiante=None)
            if estudiante.usuario:
                estudiante.usuario.email = nuevo_email
                estudiante.usuario.save()

        estudiante.save()

        return EditarEstudiante(
            success=True,
            message="Estudiante actualizado correctamente.",
            estudiante=estudiante
        )


class EliminarEstudiante(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        eliminar_definitivo = graphene.Boolean(required=False, default_value=False)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, id, eliminar_definitivo=False):
        estudiante = Estudiante.objects.filter(id=id).first()
        if not estudiante:
            return EliminarEstudiante(success=False, message="Estudiante no encontrado.")

        nombre = estudiante.nombre_completo
        if eliminar_definitivo:
            user = estudiante.usuario
            estudiante.delete()
            if user:
                user.delete()
            return EliminarEstudiante(success=True, message=f"Estudiante '{nombre}' eliminado definitivamente.")
        else:
            estudiante.estado = False
            estudiante.save()
            return EliminarEstudiante(success=True, message=f"Estudiante '{nombre}' desactivado correctamente.")


class CrearAdministrador(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        nombre_completo = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    administrador = graphene.Field(AdministradorType)

    @classmethod
    def mutate(cls, root, info, email, password, nombre_completo):
        email_clean = email.strip().lower()
        if Usuario.objects.filter(email=email_clean).exists():
            return CrearAdministrador(success=False, message="Ya existe un usuario con ese correo.", administrador=None)

        user = Usuario.objects.create_user(
            email=email_clean,
            password=password,
            rol=RolUsuario.ADMIN,
            is_staff=True
        )
        admin_perfil = Administrador.objects.create(
            usuario=user,
            nombre_completo=nombre_completo.strip()
        )

        return CrearAdministrador(
            success=True,
            message="Administrador creado exitosamente.",
            administrador=admin_perfil
        )


class EditarAdministrador(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        nombre_completo = graphene.String(required=False)
        email = graphene.String(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    administrador = graphene.Field(AdministradorType)

    @classmethod
    def mutate(cls, root, info, id, nombre_completo=None, email=None):
        admin_perfil = Administrador.objects.filter(id=id).first()
        if not admin_perfil:
            return EditarAdministrador(success=False, message="Administrador no encontrado.", administrador=None)

        if nombre_completo:
            admin_perfil.nombre_completo = nombre_completo.strip()
            admin_perfil.save()

        if email and admin_perfil.usuario:
            email_clean = email.strip().lower()
            if Usuario.objects.filter(email=email_clean).exclude(id=admin_perfil.usuario.id).exists():
                return EditarAdministrador(success=False, message="El correo ya se encuentra en uso.", administrador=None)
            admin_perfil.usuario.email = email_clean
            admin_perfil.usuario.save()

        return EditarAdministrador(
            success=True,
            message="Administrador actualizado exitosamente.",
            administrador=admin_perfil
        )


class EliminarAdministrador(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, id):
        admin_perfil = Administrador.objects.filter(id=id).first()
        if not admin_perfil:
            return EliminarAdministrador(success=False, message="Administrador no encontrado.")

        # Impedir eliminar si es el único admin
        if Administrador.objects.count() <= 1:
            return EliminarAdministrador(success=False, message="No se puede eliminar al único administrador del sistema.")

        user = admin_perfil.usuario
        admin_perfil.delete()
        if user:
            user.delete()

        return EliminarAdministrador(success=True, message="Administrador eliminado correctamente.")


class CambiarPassword(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password_actual = graphene.String(required=True)
        password_nuevo = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, email, password_actual, password_nuevo):
        user = authenticate(username=email.strip().lower(), password=password_actual)
        if not user:
            return CambiarPassword(success=False, message="La contraseña actual no es correcta.")

        if len(password_nuevo) < 4:
            return CambiarPassword(success=False, message="La nueva contraseña debe tener al menos 4 caracteres.")

        user.set_password(password_nuevo)
        user.save()
        return CambiarPassword(success=True, message="Contraseña cambiada exitosamente.")


class Mutation(graphene.ObjectType):
    login_estudiante = LoginEstudiante.Field()
    login_admin = LoginAdmin.Field()
    crear_estudiante = CrearEstudiante.Field()
    editar_estudiante = EditarEstudiante.Field()
    eliminar_estudiante = EliminarEstudiante.Field()
    crear_administrador = CrearAdministrador.Field()
    editar_administrador = EditarAdministrador.Field()
    eliminar_administrador = EliminarAdministrador.Field()
    cambiar_password = CambiarPassword.Field()

