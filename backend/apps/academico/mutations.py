import graphene
from .models import Modulo, Clase, Inscripcion
from .types import ModuloType, ClaseType, InscripcionType
from apps.usuarios.models import Estudiante
from apps.auditoria.models import HistorialActividad, TipoAccionAuditoria


class CrearModulo(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        cantidad_clases = graphene.Int(required=False, default_value=0)
        fecha_inicio = graphene.Date(required=False)
        fecha_fin = graphene.Date(required=False)
        activar = graphene.Boolean(required=False, default_value=False)

    success = graphene.Boolean()
    message = graphene.String()
    modulo = graphene.Field(ModuloType)

    @classmethod
    def mutate(cls, root, info, nombre, cantidad_clases=0, fecha_inicio=None, fecha_fin=None, activar=False):
        modulo = Modulo.objects.create(
            nombre=nombre.strip(),
            cantidad_clases=cantidad_clases,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            es_activo=False
        )

        if activar:
            modulo.activar()

        return CrearModulo(
            success=True,
            message="Módulo creado exitosamente.",
            modulo=modulo
        )


class ActivarModulo(graphene.Mutation):
    class Arguments:
        modulo_id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    modulo = graphene.Field(ModuloType)

    @classmethod
    def mutate(cls, root, info, modulo_id):
        modulo = Modulo.objects.filter(id=modulo_id).first()
        if not modulo:
            return ActivarModulo(
                success=False,
                message="El módulo solicitado no existe.",
                modulo=None
            )

        modulo_anterior = Modulo.objects.filter(es_activo=True).exclude(id=modulo.id).first()
        modulo.activar()

        HistorialActividad.objects.create(
            modulo=modulo,
            accion=TipoAccionAuditoria.ACTIVACION_MODULO,
            descripcion=f"Se activó el módulo '{modulo.nombre}'.",
            valor_anterior=modulo_anterior.nombre if modulo_anterior else "Ninguno",
            valor_nuevo=modulo.nombre
        )

        return ActivarModulo(
            success=True,
            message=f"Módulo '{modulo.nombre}' activado como el módulo vigente.",
            modulo=modulo
        )


class CrearClase(graphene.Mutation):
    class Arguments:
        modulo_id = graphene.Int(required=True)
        nombre = graphene.String(required=False, default_value="")
        fecha_programada = graphene.Date(required=True)
        hora_inicio = graphene.Time(required=False)
        hora_fin = graphene.Time(required=False)
        orden = graphene.Int(required=False, default_value=1)

    success = graphene.Boolean()
    message = graphene.String()
    clase = graphene.Field(ClaseType)

    @classmethod
    def mutate(cls, root, info, modulo_id, fecha_programada, nombre="", hora_inicio=None, hora_fin=None, orden=1):
        modulo = Modulo.objects.filter(id=modulo_id).first()
        if not modulo:
            return CrearClase(success=False, message="Módulo no encontrado.", clase=None)

        if Clase.objects.filter(modulo=modulo, fecha_programada=fecha_programada).exists():
            return CrearClase(
                success=False,
                message=f"Ya existe una clase programada para la fecha {fecha_programada} en este módulo.",
                clase=None
            )

        clase = Clase.objects.create(
            modulo=modulo,
            nombre=nombre.strip(),
            fecha_programada=fecha_programada,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
            orden=orden
        )

        return CrearClase(
            success=True,
            message="Clase programada creada exitosamente.",
            clase=clase
        )


class EditarModulo(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        nombre = graphene.String(required=False)
        cantidad_clases = graphene.Int(required=False)
        fecha_inicio = graphene.Date(required=False)
        fecha_fin = graphene.Date(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    modulo = graphene.Field(ModuloType)

    @classmethod
    def mutate(cls, root, info, id, **kwargs):
        modulo = Modulo.objects.filter(id=id).first()
        if not modulo:
            return EditarModulo(success=False, message="Módulo no encontrado.", modulo=None)

        if 'nombre' in kwargs and kwargs['nombre']:
            modulo.nombre = kwargs['nombre'].strip()
        if 'cantidad_clases' in kwargs and kwargs['cantidad_clases'] is not None:
            modulo.cantidad_clases = kwargs['cantidad_clases']
        if 'fecha_inicio' in kwargs:
            modulo.fecha_inicio = kwargs['fecha_inicio']
        if 'fecha_fin' in kwargs:
            modulo.fecha_fin = kwargs['fecha_fin']

        modulo.save()
        return EditarModulo(success=True, message="Módulo actualizado correctamente.", modulo=modulo)


class EliminarModulo(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, id):
        modulo = Modulo.objects.filter(id=id).first()
        if not modulo:
            return EliminarModulo(success=False, message="Módulo no encontrado.")

        if modulo.es_activo:
            return EliminarModulo(success=False, message="No se puede eliminar un módulo que actualmente está activo. Desactívelo o active otro primero.")

        nombre = modulo.nombre
        modulo.delete()
        return EliminarModulo(success=True, message=f"Módulo '{nombre}' eliminado correctamente.")


class EditarClase(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        nombre = graphene.String(required=False)
        fecha_programada = graphene.Date(required=False)
        hora_inicio = graphene.Time(required=False)
        hora_fin = graphene.Time(required=False)
        orden = graphene.Int(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    clase = graphene.Field(ClaseType)

    @classmethod
    def mutate(cls, root, info, id, **kwargs):
        clase = Clase.objects.filter(id=id).first()
        if not clase:
            return EditarClase(success=False, message="Clase no encontrada.", clase=None)

        if 'fecha_programada' in kwargs and kwargs['fecha_programada']:
            nueva_fecha = kwargs['fecha_programada']
            if Clase.objects.filter(modulo=clase.modulo, fecha_programada=nueva_fecha).exclude(id=id).exists():
                return EditarClase(success=False, message=f"Ya existe otra clase programada para la fecha {nueva_fecha}.", clase=None)
            clase.fecha_programada = nueva_fecha

        if 'nombre' in kwargs and kwargs['nombre'] is not None:
            clase.nombre = kwargs['nombre'].strip()
        if 'hora_inicio' in kwargs:
            clase.hora_inicio = kwargs['hora_inicio']
        if 'hora_fin' in kwargs:
            clase.hora_fin = kwargs['hora_fin']
        if 'orden' in kwargs and kwargs['orden'] is not None:
            clase.orden = kwargs['orden']

        clase.save()
        return EditarClase(success=True, message="Clase actualizada correctamente.", clase=clase)


class EliminarClase(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, id):
        clase = Clase.objects.filter(id=id).first()
        if not clase:
            return EliminarClase(success=False, message="Clase no encontrada.")

        nombre = str(clase)
        modulo = clase.modulo
        clase.delete()

        # Actualizar cantidad de clases en el modulo
        modulo.cantidad_clases = modulo.clases.count()
        modulo.save()

        return EliminarClase(success=True, message=f"{nombre} eliminada correctamente.")


class InscribirEstudiante(graphene.Mutation):
    class Arguments:
        modulo_id = graphene.Int(required=True)
        estudiante_id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()
    inscripcion = graphene.Field(InscripcionType)

    @classmethod
    def mutate(cls, root, info, modulo_id, estudiante_id):
        modulo = Modulo.objects.filter(id=modulo_id).first()
        estudiante = Estudiante.objects.filter(id=estudiante_id).first()

        if not modulo or not estudiante:
            return InscribirEstudiante(success=False, message="Módulo o estudiante no encontrado.", inscripcion=None)

        inscripcion, creada = Inscripcion.objects.get_or_create(
            modulo=modulo,
            estudiante=estudiante,
            defaults={'es_activo': True}
        )

        if not creada and not inscripcion.es_activo:
            inscripcion.es_activo = True
            inscripcion.save()

        return InscribirEstudiante(
            success=True,
            message=f"Estudiante '{estudiante.nombre_completo}' matriculado en '{modulo.nombre}'.",
            inscripcion=inscripcion
        )


class DesinscribirEstudiante(graphene.Mutation):
    class Arguments:
        modulo_id = graphene.Int(required=True)
        estudiante_id = graphene.Int(required=True)
        eliminar_definitivo = graphene.Boolean(required=False, default_value=False)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, modulo_id, estudiante_id, eliminar_definitivo=False):
        inscripcion = Inscripcion.objects.filter(modulo_id=modulo_id, estudiante_id=estudiante_id).first()
        if not inscripcion:
            return DesinscribirEstudiante(success=False, message="La inscripción no existe.")

        if eliminar_definitivo:
            inscripcion.delete()
            return DesinscribirEstudiante(success=True, message="Inscripción eliminada definitivamente.")
        else:
            inscripcion.es_activo = False
            inscripcion.save()
            return DesinscribirEstudiante(success=True, message="Inscripción desactivada para este módulo.")


class Mutation(graphene.ObjectType):
    crear_modulo = CrearModulo.Field()
    editar_modulo = EditarModulo.Field()
    eliminar_modulo = EliminarModulo.Field()
    activar_modulo = ActivarModulo.Field()
    crear_clase = CrearClase.Field()
    editar_clase = EditarClase.Field()
    eliminar_clase = EliminarClase.Field()
    inscribir_estudiante = InscribirEstudiante.Field()
    desinscribir_estudiante = DesinscribirEstudiante.Field()

