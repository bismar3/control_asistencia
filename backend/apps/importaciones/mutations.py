import base64
import graphene
from django.db import transaction
from django.core.files.base import ContentFile
from .models import ImportacionExcel, TipoImportacion
from .types import ImportacionExcelType, ResultadoValidacionExcelType, ItemErrorImportacionType
from .services import procesar_excel_estudiantes, procesar_excel_fechas
from apps.academico.models import Modulo, Clase, Inscripcion
from apps.usuarios.models import Usuario, Estudiante, RolUsuario
from apps.auditoria.models import HistorialActividad, TipoAccionAuditoria


class ValidarExcelEstudiantes(graphene.Mutation):
    class Arguments:
        archivo_base64 = graphene.String(required=True)

    Output = ResultadoValidacionExcelType

    @classmethod
    def mutate(cls, root, info, archivo_base64):
        try:
            # Eliminar prefijo data:application/... si existe
            if ',' in archivo_base64:
                archivo_base64 = archivo_base64.split(',')[1]
            bytes_data = base64.b64decode(archivo_base64)
            estudiantes, errores = procesar_excel_estudiantes(bytes_data)

            lista_errores = [
                ItemErrorImportacionType(
                    fila=err['fila'],
                    error=err['error'],
                    datos=f"{err.get('nro_registro', '')} - {err.get('nombre_completo', '')} - {err.get('email', '')}"
                )
                for err in errores
            ]

            return ResultadoValidacionExcelType(
                valido=(len(errores) == 0 and len(estudiantes) > 0),
                total_filas=len(estudiantes) + len(errores),
                total_validos=len(estudiantes),
                total_errores=len(errores),
                errores=lista_errores,
                datos_preview=estudiantes[:20]  # Primeras 20 filas para vista previa
            )
        except Exception as e:
            return ResultadoValidacionExcelType(
                valido=False,
                total_filas=0,
                total_validos=0,
                total_errores=1,
                errores=[ItemErrorImportacionType(fila=0, error=f"Error al procesar archivo: {str(e)}", datos="")],
                datos_preview=[]
            )


class ValidarExcelFechas(graphene.Mutation):
    class Arguments:
        archivo_base64 = graphene.String(required=True)

    Output = ResultadoValidacionExcelType

    @classmethod
    def mutate(cls, root, info, archivo_base64):
        try:
            if ',' in archivo_base64:
                archivo_base64 = archivo_base64.split(',')[1]
            bytes_data = base64.b64decode(archivo_base64)
            clases, errores = procesar_excel_fechas(bytes_data)

            lista_errores = [
                ItemErrorImportacionType(
                    fila=err['fila'],
                    error=err['error'],
                    datos=f"{err.get('fecha', '')} ({err.get('hora_inicio', '')} - {err.get('hora_fin', '')})"
                )
                for err in errores
            ]

            preview = [
                {
                    'fila': c['fila'],
                    'fecha': c['fecha_programada'].isoformat(),
                    'hora_inicio': c['hora_inicio'].strftime('%H:%M') if c['hora_inicio'] else None,
                    'hora_fin': c['hora_fin'].strftime('%H:%M') if c['hora_fin'] else None
                }
                for c in clases[:20]
            ]

            return ResultadoValidacionExcelType(
                valido=(len(errores) == 0 and len(clases) > 0),
                total_filas=len(clases) + len(errores),
                total_validos=len(clases),
                total_errores=len(errores),
                errores=lista_errores,
                datos_preview=preview
            )
        except Exception as e:
            return ResultadoValidacionExcelType(
                valido=False,
                total_filas=0,
                total_validos=0,
                total_errores=1,
                errores=[ItemErrorImportacionType(fila=0, error=f"Error al leer archivo de fechas: {str(e)}", datos="")],
                datos_preview=[]
            )


class ImportarEstudiantesExcel(graphene.Mutation):
    class Arguments:
        modulo_id = graphene.Int(required=True)
        archivo_base64 = graphene.String(required=True)
        nombre_archivo = graphene.String(required=False, default_value="estudiantes.xlsx")
        admin_email = graphene.String(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    total_importados = graphene.Int()
    importacion = graphene.Field(ImportacionExcelType)

    @classmethod
    def mutate(cls, root, info, modulo_id, archivo_base64, nombre_archivo="estudiantes.xlsx", admin_email=None):
        modulo = Modulo.objects.filter(id=modulo_id).first()
        if not modulo:
            return ImportarEstudiantesExcel(success=False, message="Módulo no encontrado.", total_importados=0)

        if ',' in archivo_base64:
            archivo_base64 = archivo_base64.split(',')[1]
        bytes_data = base64.b64decode(archivo_base64)
        estudiantes_data, errores = procesar_excel_estudiantes(bytes_data)

        if errores:
            return ImportarEstudiantesExcel(
                success=False,
                message=f"El archivo contiene {len(errores)} errores. Corríjalos antes de importar.",
                total_importados=0
            )

        admin_user = None
        if admin_email:
            admin_user = Usuario.objects.filter(email=admin_email.strip().lower()).first()

        importados_count = 0
        with transaction.atomic():
            importacion_rec = ImportacionExcel(
                nombre_original=nombre_archivo,
                tipo=TipoImportacion.ESTUDIANTES,
                modulo=modulo,
                usuario=admin_user,
                total_procesados=len(estudiantes_data),
                total_exitosos=len(estudiantes_data),
                total_fallidos=0,
                resumen_errores=[]
            )
            importacion_rec.archivo.save(nombre_archivo, ContentFile(bytes_data), save=True)

            for item in estudiantes_data:
                # 1. Crear o recuperar usuario
                user, _ = Usuario.objects.get_or_create(
                    email=item['email'],
                    defaults={'rol': RolUsuario.ESTUDIANTE}
                )

                # 2. Crear o actualizar estudiante
                estudiante, _ = Estudiante.objects.update_or_create(
                    nro_registro=item['nro_registro'],
                    defaults={
                        'usuario': user,
                        'nombre': item['nombre'],
                        'apellido_paterno': item['apellido_paterno'],
                        'apellido_materno': item['apellido_materno'],
                        'estado': True
                    }
                )

                # 3. Matricular en el módulo
                Inscripcion.objects.get_or_create(
                    modulo=modulo,
                    estudiante=estudiante,
                    defaults={'es_activo': True}
                )
                importados_count += 1

            HistorialActividad.objects.create(
                usuario=admin_user,
                modulo=modulo,
                accion=TipoAccionAuditoria.IMPORTACION_EXCEL,
                descripcion=f"Importación masiva de {importados_count} estudiantes.",
                registro_afectado=f"Módulo: {modulo.nombre}",
                detalles={'archivo': nombre_archivo, 'total': importados_count}
            )

        return ImportarEstudiantesExcel(
            success=True,
            message=f"Se importaron {importados_count} estudiantes correctamente al módulo {modulo.nombre}.",
            total_importados=importados_count,
            importacion=importacion_rec
        )


class ImportarFechasExcel(graphene.Mutation):
    class Arguments:
        modulo_id = graphene.Int(required=True)
        archivo_base64 = graphene.String(required=True)
        nombre_archivo = graphene.String(required=False, default_value="fechas_clases.xlsx")
        admin_email = graphene.String(required=False)

    success = graphene.Boolean()
    message = graphene.String()
    total_clases = graphene.Int()
    importacion = graphene.Field(ImportacionExcelType)

    @classmethod
    def mutate(cls, root, info, modulo_id, archivo_base64, nombre_archivo="fechas_clases.xlsx", admin_email=None):
        modulo = Modulo.objects.filter(id=modulo_id).first()
        if not modulo:
            return ImportarFechasExcel(success=False, message="Módulo no encontrado.", total_clases=0)

        if ',' in archivo_base64:
            archivo_base64 = archivo_base64.split(',')[1]
        bytes_data = base64.b64decode(archivo_base64)
        clases_data, errores = procesar_excel_fechas(bytes_data)

        if errores:
            return ImportarFechasExcel(
                success=False,
                message=f"El archivo contiene {len(errores)} errores de formato.",
                total_clases=0
            )

        admin_user = None
        if admin_email:
            admin_user = Usuario.objects.filter(email=admin_email.strip().lower()).first()

        importados_count = 0
        with transaction.atomic():
            importacion_rec = ImportacionExcel(
                nombre_original=nombre_archivo,
                tipo=TipoImportacion.FECHAS_CLASES,
                modulo=modulo,
                usuario=admin_user,
                total_procesados=len(clases_data),
                total_exitosos=len(clases_data),
                total_fallidos=0,
                resumen_errores=[]
            )
            importacion_rec.archivo.save(nombre_archivo, ContentFile(bytes_data), save=True)

            # Ordenar clases por fecha
            clases_data.sort(key=lambda x: x['fecha_programada'])

            for idx, c in enumerate(clases_data, start=1):
                Clase.objects.update_or_create(
                    modulo=modulo,
                    fecha_programada=c['fecha_programada'],
                    defaults={
                        'nombre': f"Clase {idx}",
                        'hora_inicio': c['hora_inicio'],
                        'hora_fin': c['hora_fin'],
                        'orden': idx
                    }
                )
                importados_count += 1

            modulo.cantidad_clases = Clase.objects.filter(modulo=modulo).count()
            if clases_data:
                modulo.fecha_inicio = clases_data[0]['fecha_programada']
                modulo.fecha_fin = clases_data[-1]['fecha_programada']
            modulo.save()

            HistorialActividad.objects.create(
                usuario=admin_user,
                modulo=modulo,
                accion=TipoAccionAuditoria.IMPORTACION_EXCEL,
                descripcion=f"Importación de calendario: {importados_count} clases registradas.",
                registro_afectado=f"Módulo: {modulo.nombre}",
                detalles={'archivo': nombre_archivo, 'total_clases': importados_count}
            )

        return ImportarFechasExcel(
            success=True,
            message=f"Se programaron {importados_count} clases para el módulo {modulo.nombre}.",
            total_clases=importados_count,
            importacion=importacion_rec
        )


class EliminarImportacion(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @classmethod
    def mutate(cls, root, info, id):
        importacion = ImportacionExcel.objects.filter(id=id).first()
        if not importacion:
            return EliminarImportacion(success=False, message="Registro de importación no encontrado.")

        # Borrar el archivo del disco si existe
        if importacion.archivo:
            importacion.archivo.delete(save=False)

        importacion.delete()
        return EliminarImportacion(success=True, message="Registro de importación eliminado.")


class Mutation(graphene.ObjectType):
    validar_excel_estudiantes = ValidarExcelEstudiantes.Field()
    validar_excel_fechas = ValidarExcelFechas.Field()
    importar_estudiantes_excel = ImportarEstudiantesExcel.Field()
    importar_fechas_excel = ImportarFechasExcel.Field()
    eliminar_importacion = EliminarImportacion.Field()

