# Configuración de TFLint para el proyecto control_asist.
# Este archivo SÍ va a Git, para que todo el equipo use las mismas reglas.

# Reglas generales de Terraform.
# "all" activa TODAS las reglas (más estricto que "recommended").
plugin "terraform" {
  enabled = true
  preset  = "all"
}

# Reglas específicas de AWS (tipos de instancia, AMIs, etc.)
plugin "aws" {
  enabled = true
  version = "0.48.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}