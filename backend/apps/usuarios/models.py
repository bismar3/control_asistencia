from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class RolUsuario(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrador'
    ESTUDIANTE = 'ESTUDIANTE', 'Estudiante'


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es obligatorio')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', RolUsuario.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(
        unique=True,
        max_length=255,
        verbose_name="Correo Electrónico"
    )
    rol = models.CharField(
        max_length=20,
        choices=RolUsuario.choices,
        default=RolUsuario.ESTUDIANTE,
        verbose_name="Rol"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Usuario Activo"
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name="Acceso Staff"
    )
    date_joined = models.DateTimeField(
        default=timezone.now,
        verbose_name="Fecha de Registro"
    )

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.email} ({self.get_rol_display()})"


class Estudiante(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='perfil_estudiante',
        null=True,
        blank=True
    )
    nro_registro = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Número de Registro"
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name="Nombres"
    )
    apellido_paterno = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name="Apellido Paterno"
    )
    apellido_materno = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name="Apellido Materno"
    )
    celular = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name="Celular"
    )
    estado = models.BooleanField(
        default=True,
        verbose_name="Estado Activo"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )

    class Meta:
        verbose_name = "Estudiante"
        verbose_name_plural = "Estudiantes"
        ordering = ['apellido_paterno', 'apellido_materno', 'nombre']

    @property
    def nombre_completo(self):
        apellidos = f"{self.apellido_paterno} {self.apellido_materno}".strip()
        if apellidos:
            return f"{self.nombre} {apellidos}".strip()
        return self.nombre

    def __str__(self):
        return f"[{self.nro_registro}] {self.nombre_completo}"


class Administrador(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='perfil_administrador'
    )
    nombre_completo = models.CharField(
        max_length=200,
        verbose_name="Nombre Completo"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )

    class Meta:
        verbose_name = "Administrador"
        verbose_name_plural = "Administradores"

    def __str__(self):
        return f"{self.nombre_completo} ({self.usuario.email})"
