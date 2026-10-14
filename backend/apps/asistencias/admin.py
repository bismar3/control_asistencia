from django.contrib import admin
from .models import Asistencia


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'clase', 'estado', 'fecha_hora_marca', 'modificado_por', 'fecha_modificacion')
    list_filter = ('estado', 'clase__modulo', 'clase__fecha_programada')
    search_fields = ('estudiante__nombre', 'estudiante__nro_registro', 'clase__nombre')
    ordering = ('-clase__fecha_programada', 'estudiante__apellido_paterno')
