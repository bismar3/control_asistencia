from django.contrib import admin
from .models import Usuario, Estudiante, Administrador


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('email', 'rol', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('rol', 'is_active', 'is_staff')
    search_fields = ('email',)
    ordering = ('-date_joined',)


@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ('nro_registro', 'nombre_completo', 'celular', 'estado', 'created_at')
    list_filter = ('estado',)
    search_fields = ('nro_registro', 'nombre', 'apellido_paterno', 'apellido_materno')


@admin.register(Administrador)
class AdministradorAdmin(admin.ModelAdmin):
    list_display = ('nombre_completo', 'usuario', 'created_at')
    search_fields = ('nombre_completo', 'usuario__email')
