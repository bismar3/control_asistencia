# =====================================================================
# BOOTSTRAP: crea el bucket S3 donde se guardará el state del proyecto.
# Se ejecuta UNA sola vez. Su propio state queda local (aquí mismo).
# =====================================================================

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-2"
}

# Consulta tu número de cuenta (para que el nombre del bucket sea único en el mundo)
data "aws_caller_identity" "yo" {}

# El bucket donde vivirá el state
resource "aws_s3_bucket" "tfstate" {
  bucket = "control-asist-tfstate-${data.aws_caller_identity.yo.account_id}"

  # Protección: Terraform se niega a borrar este bucket por accidente
  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Proyecto      = "control-asist"
    GestionadoPor = "Terraform"
  }
}

# Versionado: guarda copias anteriores del state (como un Ctrl + Z)
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Cifrado: el state tiene contraseñas, así que se guarda cifrado
resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Bloquea cualquier acceso público al bucket
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket" {
  description = "Copia este nombre en backend.tf"
  value       = aws_s3_bucket.tfstate.bucket
}