# Datos de entrada
variable "ip_permitida" {
  description = "Tu IP publica con /32 al final; Ansible entra por SSH desde aqui"
  type        = string
}

variable "proyecto" {
  description = "Prefijo de los nombres de los recursos"
  type        = string
  default     = "ansible"
}