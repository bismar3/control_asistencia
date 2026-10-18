# ---------------- Nube ----------------
variable "region" {
  description = "Región de AWS (us-east-2 = Ohio)"
  type        = string
  default     = "us-east-2"
}

variable "proyecto" {
  description = "Nombre corto; se usa para nombrar los recursos en AWS"
  type        = string
  default     = "control-asist"
}

variable "tipo_instancia" {
  description = "Tamaño de los servidores (t3.micro = capa gratuita)"
  type        = string
  default     = "t3.micro"
}

# ---------------- Acceso SSH ----------------
variable "ips_permitidas" {
  description = "IPs (con /32) que pueden entrar por SSH: la tuya y la de tu compañero"
  type        = list(string)
}

variable "ruta_llave_publica" {
  description = "Llave PÚBLICA que se registra en AWS"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ruta_llave_privada" {
  description = "Llave PRIVADA que usa Terraform para entrar y subir el código"
  type        = string
  default     = "~/.ssh/id_ed25519"
}

# ---------------- Django ----------------
variable "django_wsgi" {
  description = "Módulo WSGI de Django (carpeta del settings + .wsgi)"
  type        = string
  default     = "config.wsgi"
}

variable "puerto_backend" {
  description = "Puerto interno donde corre Django (Gunicorn)"
  type        = number
  default     = 8000
}

variable "django_secret_key" {
  description = "SECRET_KEY de Django para producción"
  type        = string
  sensitive   = true
}

# ---------------- PostgreSQL (vive en el servidor backend) ----------------
variable "db_nombre" {
  type    = string
  default = "asist"
}

variable "db_usuario" {
  type    = string
  default = "asist_user"
}

variable "db_password" {
  description = "Contraseña del usuario de PostgreSQL en el servidor"
  type        = string
  sensitive   = true
}