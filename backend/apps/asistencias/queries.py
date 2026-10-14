import graphene
from django.utils import timezone
from .models import Asistencia, EstadoAsistencia
from .types import (
    AsistenciaType,
    ResumenAsistenciaEstudianteType,
    ItemHistorialEstudianteType,
    FilaReporteGeneralType
)
from apps.academico.models import Modulo, Clase, Inscripcion
from apps.usuarios.models import Estudiante


class Query(graphene.ObjectType):
    asistencias = graphene.List(AsistenciaType)
    asistencias_por_clase = graphene.List(
        AsistenciaType,
        clase_id=graphene.Int(required=True)
    )
    mi_historial_asistencia = graphene.Field(
        ResumenAsistenciaEstudianteType,
        estudiante_id=graphene.Int(),
        nro_registro=graphene.String()
    )
    reporte_general_asistencias = graphene.List(
        FilaReporteGeneralType,
        modulo_id=graphene.Int()
    )

    def resolve_asistencias(self, info):
        return Asistencia.objects.select_related('clase', 'estudiante', 'modificado_por').all()

    def resolve_asistencias_por_clase(self, info, clase_id):
        clase = Clase.objects.filter(id=clase_id).first()
        if not clase:
            return []

        # Obtener todos los estudiantes inscritos en el módulo de la clase
        inscripciones = Inscripcion.objects.filter(
            modulo=clase.modulo,
            es_activo=True
        ).select_related('estudiante')

        # Asegurar que cada estudiante tenga su registro de asistencia instanciado
        resultado = []
        for ins in inscripciones:
            asistencia, _ = Asistencia.objects.get_or_create(
                clase=clase,
                estudiante=ins.estudiante,
                defaults={'estado': EstadoAsistencia.FALTA}
            )
            resultado.append(asistencia)
        return resultado

    def resolve_mi_historial_asistencia(self, info, estudiante_id=None, nro_registro=None):
        hoy = timezone.localdate()
        modulo_activo = Modulo.objects.filter(es_activo=True).first()
        if not modulo_activo:
            return None

        estudiante = None
        if estudiante_id:
            estudiante = Estudiante.objects.filter(id=estudiante_id).first()
        elif nro_registro:
            estudiante = Estudiante.objects.filter(nro_registro=nro_registro.strip()).first()

        if not estudiante:
            return None

        # Obtener todas las clases del módulo activo
        clases = Clase.objects.filter(modulo=modulo_activo).order_by('fecha_programada', 'orden')
        asistencias_map = {
            a.clase_id: a for a in Asistencia.objects.filter(estudiante=estudiante, clase__in=clases)
        }

        historial = []
        total_asistencias = 0
        total_faltas = 0
        puede_marcar_hoy = False
        clase_hoy_id = None

        for c in clases:
            asist = asistencias_map.get(c.id)
            es_hoy = (c.fecha_programada == hoy)
            es_pasada = (c.fecha_programada < hoy)

            if asist and asist.estado == EstadoAsistencia.PRESENTE:
                estado = EstadoAsistencia.PRESENTE
                hora_marca = timezone.localtime(asist.fecha_hora_marca).strftime("%H:%M:%S") if asist.fecha_hora_marca else ""
                total_asistencias += 1
                puede_marcar = False
            else:
                # Regla RN-05: Si no marcó y la fecha ya concluyó, equivale a Falta
                estado = EstadoAsistencia.FALTA if es_pasada else (asist.estado if asist else EstadoAsistencia.FALTA)
                hora_marca = ""
                if es_pasada:
                    total_faltas += 1
                # Regla RN-04: Solo puede marcar durante el día de clase programado
                puede_marcar = es_hoy and (asist is None or asist.estado != EstadoAsistencia.PRESENTE)

            if es_hoy:
                clase_hoy_id = c.id
                if puede_marcar:
                    puede_marcar_hoy = True

            historial.append(ItemHistorialEstudianteType(
                clase_id=c.id,
                clase_nombre=c.nombre or f"Clase {c.orden}",
                fecha_programada=c.fecha_programada,
                hora_inicio=c.hora_inicio,
                hora_fin=c.hora_fin,
                estado=estado,
                hora_marca=hora_marca,
                es_hoy=es_hoy,
                puede_marcar=puede_marcar
            ))

        total_clases = len(clases)
        porcentaje = round((total_asistencias / total_clases) * 100, 1) if total_clases > 0 else 0.0

        return ResumenAsistenciaEstudianteType(
            estudiante=estudiante,
            total_clases=total_clases,
            total_asistencias=total_asistencias,
            total_faltas=total_faltas,
            porcentaje_asistencia=porcentaje,
            puede_marcar_hoy=puede_marcar_hoy,
            clase_hoy_id=clase_hoy_id,
            historial=historial
        )

    def resolve_reporte_general_asistencias(self, info, modulo_id=None):
        if modulo_id:
            modulo = Modulo.objects.filter(id=modulo_id).first()
        else:
            modulo = Modulo.objects.filter(es_activo=True).first()

        if not modulo:
            return []

        clases = Clase.objects.filter(modulo=modulo).order_by('fecha_programada', 'orden')
        inscripciones = Inscripcion.objects.filter(
            modulo=modulo,
            es_activo=True
        ).select_related('estudiante', 'estudiante__usuario').order_by('estudiante__apellido_paterno')

        reporte = []
        for ins in inscripciones:
            estudiante = ins.estudiante
            asistencias_dict = {}
            presentes = 0
            faltas = 0

            for c in clases:
                asist = Asistencia.objects.filter(clase=c, estudiante=estudiante).first()
                estado = asist.estado if asist else EstadoAsistencia.FALTA
                asistencias_dict[str(c.id)] = {
                    'estado': estado,
                    'hora': timezone.localtime(asist.fecha_hora_marca).strftime("%H:%M:%S") if (asist and asist.fecha_hora_marca) else None
                }
                if estado == EstadoAsistencia.PRESENTE:
                    presentes += 1
                else:
                    faltas += 1

            total = len(clases)
            porcentaje = round((presentes / total) * 100, 1) if total > 0 else 0.0

            reporte.append(FilaReporteGeneralType(
                estudiante=estudiante,
                asistencias_por_clase=asistencias_dict,
                total_presentes=presentes,
                total_faltas=faltas,
                porcentaje=porcentaje
            ))

        return reporte
