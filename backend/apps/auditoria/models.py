from django.db import models
from django.conf import settings


class TipoAccionAuditoria(models.TextChoices):
    MARCADO_ASISTENCIA = 'MARCADO_ASISTENCIA', 'Marcado de Asistencia'
    MODIFICACION_ADMIN = 'MODIFICACION_ADMIN', 'Modificación Administrativa'
    ACTIVACION_MODULO = 'ACTIVACION_MODULO', 'Activación de Nuevo Módulo'
    IMPORTACION_EXCEL = 'IMPORTACION_EXCEL', 'Importación desde Excel'
    LOGIN = 'LOGIN', 'Inicio de Sesión'
    OTRO = 'OTRO', 'Otra Acción'


class HistorialActividad(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actividades_auditoria',
        verbose_name="Usuario Responsable"
    )
    modulo = models.ForeignKey(
        'academico.Modulo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actividades_auditoria',
        verbose_name="Módulo Académico"
    )
    accion = models.CharField(
        max_length=50,
        choices=TipoAccionAuditoria.choices,
        default=TipoAccionAuditoria.OTRO,
        verbose_name="Tipo de Acción"
    )
    descripcion = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name="Descripción de la Acción"
    )
    registro_afectado = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name="Registro Afectado"
    )
    valor_anterior = models.TextField(
        blank=True,
        default='',
        verbose_name="Valor Anterior"
    )
    valor_nuevo = models.TextField(
        blank=True,
        default='',
        verbose_name="Valor Nuevo"
    )
    detalles = models.JSONField(
        blank=True,
        default=dict,
        verbose_name="Detalles Adicionales"
    )
    ip_origen = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="IP de Origen"
    )
    fecha_hora = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha y Hora de la Acción"
    )

    class Meta:
        verbose_name = "Historial de Actividad"
        verbose_name_plural = "Historial de Actividades"
        ordering = ['-fecha_hora']

    def __str__(self):
        user_str = self.usuario.email if self.usuario else "Sistema/Anónimo"
        return f"[{self.fecha_hora.strftime('%Y-%m-%d %H:%M')}] {user_str} - {self.get_accion_display()}"
