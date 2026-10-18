# =====================================================================
# BACKEND: el state de este proyecto vive en el bucket S3, no en la PC.
# Ojo: dentro de un bloque backend NO se pueden usar variables,
# por eso el nombre del bucket va escrito directamente.
# =====================================================================

terraform {
  backend "s3" {
    bucket       = "control-asist-tfstate-487003832843"
    key          = "control-asist/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
  }
}