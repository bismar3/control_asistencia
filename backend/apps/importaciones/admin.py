from django.contrib import admin
from .models import ImportacionExcel


@admin.register(ImportacionExcel)
class ImportacionExcelAdmin(admin.ModelAdmin):
    list_display = ('nombre_original', 'tipo', 'modulo', 'total_procesados', 'total_exitosos', 'total_fallidos', 'fecha_subida', 'usuario')
    list_filter = ('tipo', 'modulo', 'fecha_subida')
    search_fields = ('nombre_original',)
    readonly_fields = ('fecha_subida',)
