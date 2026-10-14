from django.db import models
from django.conf import settings


class EstadoAsistencia(models.TextChoices):
    PRESENTE = 'PRESENTE', 'Presente'
    FALTA = 'FALTA', 'Falta'
    JUSTIFICADO = 'JUSTIFICADO', 'Justificado'


class Asistencia(models.Model):
    clase = models.ForeignKey(
        'academico.Clase',
        on_delete=models.CASCADE,
        related_name='asistencias',
        verbose_name="Clase Programada"
    )
    estudiante = models.ForeignKey(
        'usuarios.Estudiante',
        on_delete=models.CASCADE,
        related_name='asistencias',
        verbose_name="Estudiante"
    )
    fecha_hora_marca = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha y Hora Real de Marcado"
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoAsistencia.choices,
        default=EstadoAsistencia.FALTA,
        verbose_name="Estado de Asistencia"
    )
    observacion = models.TextField(
        blank=True,
        default='',
        verbose_name="Observación"
    )
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='asistencias_modificadas',
        verbose_name="Modificado por (Administrador)"
    )
    fecha_modificacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de Última Modificación"
    )

    class Meta:
        verbose_name = "Asistencia"
        verbose_name_plural = "Asistencias"
        unique_together = ('clase', 'estudiante')
        ordering = ['clase__fecha_programada', 'estudiante__apellido_paterno']

    def __str__(self):
        return f"{self.estudiante.nombre_completo} - {self.clase} -> {self.get_estado_display()}"
