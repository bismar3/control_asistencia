from django.contrib import admin
from .models import HistorialActividad


@admin.register(HistorialActividad)
class HistorialActividadAdmin(admin.ModelAdmin):
    list_display = ('fecha_hora', 'usuario', 'modulo', 'accion', 'descripcion', 'registro_afectado', 'ip_origen')
    list_filter = ('accion', 'modulo', 'fecha_hora')
    search_fields = ('usuario__email', 'descripcion', 'registro_afectado')
    readonly_fields = ('fecha_hora',)
