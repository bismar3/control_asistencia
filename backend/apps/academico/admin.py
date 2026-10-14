from django.contrib import admin
from .models import Modulo, Clase, Inscripcion


@admin.register(Modulo)
class ModuloAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'cantidad_clases', 'fecha_inicio', 'fecha_fin', 'es_activo', 'created_at')
    list_filter = ('es_activo',)
    search_fields = ('nombre',)


@admin.register(Clase)
class ClaseAdmin(admin.ModelAdmin):
    list_display = ('modulo', 'orden', 'nombre', 'fecha_programada', 'hora_inicio', 'hora_fin')
    list_filter = ('modulo', 'fecha_programada')
    search_fields = ('nombre', 'modulo__nombre')
    ordering = ('modulo', 'fecha_programada', 'orden')


@admin.register(Inscripcion)
class InscripcionAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'modulo', 'es_activo', 'fecha_inscripcion')
    list_filter = ('modulo', 'es_activo')
    search_fields = ('estudiante__nombre', 'estudiante__nro_registro', 'modulo__nombre')
