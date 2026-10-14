import graphene
from django.utils import timezone
from .models import Asistencia, EstadoAsistencia
from .types import AsistenciaType
from apps.academico.models import Modulo, Clase, Inscripcion
from apps.usuarios.models import Estudiante, Usuario
from apps.auditoria.models import HistorialActividad, TipoAccionAuditoria


class MarcarAsistenciaEstudiante(graphene.Mutation):
    class Arguments:
        estudiante_id = graphene.Int(required=False)
        nro_registro = graphene.String(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    asistencia = graphene.Field(AsistenciaType)

    @classmethod
    def mutate(cls, root, info, estudiante_id=None, nro_registro=None):
        ahora = timezone.localtime()
        hoy = ahora.date()

        # 1. Obtener estudiante
        estudiante = None
        if estudiante_id:
            estudiante = Estudiante.objects.filter(id=estudiante_id).first()
        elif nro_registro:
            estudiante = Estudiante.objects.filter(nro_registro=nro_registro.strip()).first()

        if not estudiante:
            return MarcarAsistenciaEstudiante(
                success=False,
                message="Estudiante no encontrado.",
                asistencia=None
            )

        # 2. Obtener módulo activo (RN-01)
        modulo_activo = Modulo.objects.filter(es_activo=True).first()
        if not modulo_activo:
            return MarcarAsistenciaEstudiante(
                success=False,
                message="No hay ningún módulo académico activo en el sistema.",
                asistencia=None
            )

        # 3. Validar inscripción en el módulo activo
        inscrito = Inscripcion.objects.filter(
            modulo=modulo_activo,
            estudiante=estudiante,
            es_activo=True
        ).exists()

        if not inscrito:
            return MarcarAsistenciaEstudiante(
                success=False,
                message="El estudiante no se encuentra matriculado en el módulo activo.",
                asistencia=None
            )

        # 4. Validar fecha de clase (RN-04)
        clase_hoy = Clase.objects.filter(
            modulo=modulo_activo,
            fecha_programada=hoy
        ).first()

        if not clase_hoy:
            return MarcarAsistenciaEstudiante(
                success=False,
                message=f"Hoy ({hoy.strftime('%d/%m/%Y')}) no es una fecha de clase programada para este módulo.",
                asistencia=None
            )

        # 5. Validar marca única (RN-03)
        asistencia, creada = Asistencia.objects.get_or_create(
            clase=clase_hoy,
            estudiante=estudiante,
            defaults={
                'estado': EstadoAsistencia.PRESENTE,
                'fecha_hora_marca': ahora,
                'observacion': 'Marcado por el estudiante vía web'
            }
        )

        if not creada and asistencia.estado == EstadoAsistencia.PRESENTE:
            return MarcarAsistenciaEstudiante(
                success=False,
                message=f"Ya registraste tu asistencia para la clase de hoy a las {timezone.localtime(asistencia.fecha_hora_marca).strftime('%H:%M:%S')}.",
                asistencia=asistencia
            )

        if not creada:
            asistencia.estado = EstadoAsistencia.PRESENTE
            asistencia.fecha_hora_marca = ahora
            asistencia.observacion = 'Marcado por el estudiante vía web'
            asistencia.save()

        # 6. Registrar en auditoría (RN-07, RF-09)
        HistorialActividad.objects.create(
            usuario=estudiante.usuario,
            modulo=modulo_activo,
            accion=TipoAccionAuditoria.MARCADO_ASISTENCIA,
            descripcion=f"Asistencia marcada por estudiante: {estudiante.nombre_completo}",
            registro_afectado=f"Clase: {clase_hoy.nombre or clase_hoy.fecha_programada} | Estudiante: {estudiante.nro_registro}",
            valor_anterior="FALTA",
            valor_nuevo="PRESENTE",
            detalles={'hora_marca': ahora.strftime('%H:%M:%S'), 'fecha': hoy.isoformat()}
        )

        return MarcarAsistenciaEstudiante(
            success=True,
            message=f"¡Asistencia registrada con éxito! Hora: {ahora.strftime('%H:%M:%S')}",
            asistencia=asistencia
        )


class ModificarAsistenciaAdmin(graphene.Mutation):
    class Arguments:
        clase_id = graphene.Int(required=True)
        estudiante_id = graphene.Int(required=True)
        nuevo_estado = graphene.String(required=True, description="PRESENTE, FALTA o JUSTIFICADO")
        observacion = graphene.String(required=False, default_value="")
        admin_email = graphene.String(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    asistencia = graphene.Field(AsistenciaType)

    @classmethod
    def mutate(cls, root, info, clase_id, estudiante_id, nuevo_estado, observacion="", admin_email=None):
        clase = Clase.objects.filter(id=clase_id).first()
        estudiante = Estudiante.objects.filter(id=estudiante_id).first()

        if not clase or not estudiante:
            return ModificarAsistenciaAdmin(
                success=False,
                message="Clase o estudiante no válido.",
                asistencia=None
            )

        estado_normalizado = nuevo_estado.strip().upper()
        if estado_normalizado not in [EstadoAsistencia.PRESENTE, EstadoAsistencia.FALTA, EstadoAsistencia.JUSTIFICADO]:
            return ModificarAsistenciaAdmin(
                success=False,
                message="Estado no válido. Debe ser PRESENTE, FALTA o JUSTIFICADO.",
                asistencia=None
            )

        admin_user = None
        if admin_email:
            admin_user = Usuario.objects.filter(email=admin_email.strip().lower()).first()

        asistencia, creada = Asistencia.objects.get_or_create(
            clase=clase,
            estudiante=estudiante,
            defaults={'estado': EstadoAsistencia.FALTA}
        )

        valor_anterior = asistencia.estado
        asistencia.estado = estado_normalizado
        if observacion:
            asistencia.observacion = observacion.strip()
        if admin_user:
            asistencia.modificado_por = admin_user
        if estado_normalizado == EstadoAsistencia.PRESENTE and not asistencia.fecha_hora_marca:
            asistencia.fecha_hora_marca = timezone.localtime()
        asistencia.save()

        # Registrar en Auditoría (RF-07, RN-07)
        HistorialActividad.objects.create(
            usuario=admin_user,
            modulo=clase.modulo,
            accion=TipoAccionAuditoria.MODIFICACION_ADMIN,
            descripcion=f"Modificación manual de asistencia para {estudiante.nombre_completo}",
            registro_afectado=f"Clase: {clase.fecha_programada} | Estudiante: {estudiante.nro_registro}",
            valor_anterior=valor_anterior,
            valor_nuevo=estado_normalizado,
            detalles={'observacion': observacion}
        )

        return ModificarAsistenciaAdmin(
            success=True,
            message=f"Asistencia actualizada a '{estado_normalizado}' correctamente.",
            asistencia=asistencia
        )


class EliminarAsistencia(graphene.Mutation):
    class Arguments:
        clase_id = graphene.Int(required=True)
        estudiante_id = graphene.Int(required=True)
        admin_email = graphene.String(required=False)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, clase_id, estudiante_id, admin_email=None):
        asistencia = Asistencia.objects.filter(clase_id=clase_id, estudiante_id=estudiante_id).first()
        if not asistencia:
            return EliminarAsistencia(success=False, message="Registro de asistencia no encontrado.")

        admin_user = None
        if admin_email:
            admin_user = Usuario.objects.filter(email=admin_email.strip().lower()).first()

        estudiante_nombre = asistencia.estudiante.nombre_completo
        clase_str = str(asistencia.clase)

        HistorialActividad.objects.create(
            usuario=admin_user,
            modulo=asistencia.clase.modulo,
            accion=TipoAccionAuditoria.MODIFICACION_ADMIN,
            descripcion=f"Eliminación/reinicio de asistencia para {estudiante_nombre}",
            registro_afectado=f"Clase: {clase_str} | Estudiante: {asistencia.estudiante.nro_registro}",
            valor_anterior=asistencia.estado,
            valor_nuevo="ELIMINADO / FALTA"
        )

        asistencia.delete()
        return EliminarAsistencia(success=True, message=f"Registro de asistencia para '{estudiante_nombre}' reiniciado.")


class MarcarAsistenciasMasivas(graphene.Mutation):
    class Arguments:
        clase_id = graphene.Int(required=True)
        estudiante_ids = graphene.List(graphene.Int, required=True)
        estado = graphene.String(required=True)
        admin_email = graphene.String(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    total_actualizados = graphene.Int()

    @classmethod
    def mutate(cls, root, info, clase_id, estudiante_ids, estado, admin_email=None):
        clase = Clase.objects.filter(id=clase_id).first()
        if not clase:
            return MarcarAsistenciasMasivas(success=False, message="Clase no encontrada.", total_actualizados=0)

        estado_norm = estado.strip().upper()
        if estado_norm not in [EstadoAsistencia.PRESENTE, EstadoAsistencia.FALTA, EstadoAsistencia.JUSTIFICADO]:
            return MarcarAsistenciasMasivas(success=False, message="Estado no válido.", total_actualizados=0)

        admin_user = None
        if admin_email:
            admin_user = Usuario.objects.filter(email=admin_email.strip().lower()).first()

        ahora = timezone.localtime()
        actualizados = 0

        for est_id in estudiante_ids:
            estudiante = Estudiante.objects.filter(id=est_id).first()
            if not estudiante:
                continue

            asist, _ = Asistencia.objects.get_or_create(
                clase=clase,
                estudiante=estudiante,
                defaults={'estado': estado_norm}
            )
            asist.estado = estado_norm
            if estado_norm == EstadoAsistencia.PRESENTE and not asist.fecha_hora_marca:
                asist.fecha_hora_marca = ahora
            if admin_user:
                asist.modificado_por = admin_user
            asist.save()
            actualizados += 1

        HistorialActividad.objects.create(
            usuario=admin_user,
            modulo=clase.modulo,
            accion=TipoAccionAuditoria.MODIFICACION_ADMIN,
            descripcion=f"Modificación masiva de {actualizados} asistencias a '{estado_norm}'.",
            registro_afectado=f"Clase: {clase.fecha_programada}",
            valor_nuevo=estado_norm
        )

        return MarcarAsistenciasMasivas(
            success=True,
            message=f"{actualizados} asistencias actualizadas a '{estado_norm}'.",
            total_actualizados=actualizados
        )


class Mutation(graphene.ObjectType):
    marcar_asistencia = MarcarAsistenciaEstudiante.Field()
    modificar_asistencia_admin = ModificarAsistenciaAdmin.Field()
    eliminar_asistencia = EliminarAsistencia.Field()
    marcar_asistencias_masivas = MarcarAsistenciasMasivas.Field()

