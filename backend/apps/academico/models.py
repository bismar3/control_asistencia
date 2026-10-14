from django.db import models


class Modulo(models.Model):
    nombre = models.CharField(
        max_length=200,
        verbose_name="Nombre del Módulo"
    )
    cantidad_clases = models.PositiveIntegerField(
        default=0,
        verbose_name="Cantidad de Clases"
    )
    fecha_inicio = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de Inicio"
    )
    fecha_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de Fin"
    )
    es_activo = models.BooleanField(
        default=False,
        verbose_name="¿Es Módulo Activo?"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )

    class Meta:
        verbose_name = "Módulo Académico"
        verbose_name_plural = "Módulos Académicos"
        ordering = ['-created_at']

    def __str__(self):
        activo_str = " (Activo)" if self.es_activo else " (Inactivo)"
        return f"{self.nombre}{activo_str}"

    def activar(self):
        """
        Regla RN-01: Solo un módulo activo a la vez.
        Desactiva todos los módulos existentes y activa este.
        """
        Modulo.objects.exclude(id=self.id).update(es_activo=False)
        self.es_activo = True
        self.save()


class Clase(models.Model):
    modulo = models.ForeignKey(
        Modulo,
        on_delete=models.CASCADE,
        related_name='clases',
        verbose_name="Módulo"
    )
    nombre = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name="Tema o Título de Clase"
    )
    fecha_programada = models.DateField(
        verbose_name="Fecha Programada"
    )
    hora_inicio = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Hora Inicio"
    )
    hora_fin = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Hora Fin"
    )
    orden = models.PositiveIntegerField(
        default=1,
        verbose_name="Número / Orden de Clase"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )

    class Meta:
        verbose_name = "Clase"
        verbose_name_plural = "Clases"
        unique_together = ('modulo', 'fecha_programada')
        ordering = ['fecha_programada', 'orden']

    def __str__(self):
        return f"Clase {self.orden} - {self.fecha_programada} ({self.modulo.nombre})"


class Inscripcion(models.Model):
    modulo = models.ForeignKey(
        Modulo,
        on_delete=models.CASCADE,
        related_name='inscripciones',
        verbose_name="Módulo"
    )
    estudiante = models.ForeignKey(
        'usuarios.Estudiante',
        on_delete=models.CASCADE,
        related_name='inscripciones',
        verbose_name="Estudiante"
    )
    fecha_inscripcion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Inscripción"
    )
    es_activo = models.BooleanField(
        default=True,
        verbose_name="Inscripción Activa"
    )

    class Meta:
        verbose_name = "Inscripción de Estudiante"
        verbose_name_plural = "Inscripciones de Estudiantes"
        unique_together = ('modulo', 'estudiante')
        ordering = ['-fecha_inscripcion']

    def __str__(self):
        return f"{self.estudiante.nombre_completo} en {self.modulo.nombre}"
