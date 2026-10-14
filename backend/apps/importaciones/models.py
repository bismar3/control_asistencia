from django.db import models
from django.conf import settings


class TipoImportacion(models.TextChoices):
    ESTUDIANTES = 'ESTUDIANTES', 'Estudiantes'
    FECHAS_CLASES = 'FECHAS_CLASES', 'Fechas de Clases y Horarios'


class ImportacionExcel(models.Model):
    archivo = models.FileField(
        upload_to='importaciones_excel/%Y/%m/',
        verbose_name="Archivo Excel"
    )
    nombre_original = models.CharField(
        max_length=255,
        verbose_name="Nombre Original del Archivo"
    )
    tipo = models.CharField(
        max_length=30,
        choices=TipoImportacion.choices,
        verbose_name="Tipo de Importación"
    )
    modulo = models.ForeignKey(
        'academico.Modulo',
        on_delete=models.CASCADE,
        related_name='importaciones_excel',
        verbose_name="Módulo Académico Asociado"
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='importaciones_realizadas',
        verbose_name="Subido por"
    )
    fecha_subida = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Subida"
    )
    total_procesados = models.PositiveIntegerField(
        default=0,
        verbose_name="Total de Filas Procesadas"
    )
    total_exitosos = models.PositiveIntegerField(
        default=0,
        verbose_name="Total Exitosos"
    )
    total_fallidos = models.PositiveIntegerField(
        default=0,
        verbose_name="Total Fallidos"
    )
    resumen_errores = models.JSONField(
        blank=True,
        default=list,
        verbose_name="Detalle de Errores Encontrados"
    )

    class Meta:
        verbose_name = "Importación de Excel"
        verbose_name_plural = "Importaciones de Excel"
        ordering = ['-fecha_subida']

    def __str__(self):
        return f"[{self.get_tipo_display()}] {self.nombre_original} ({self.fecha_subida.strftime('%Y-%m-%d %H:%M')})"
