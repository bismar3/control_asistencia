# Terraform, proveedores y dónde se guarda el state
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }

  # State en el bucket del equipo, en su propia "carpeta"
  backend "s3" {
    bucket       = "control-asist-tfstate-487003832843"
    key          = "ansible/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-east-2"

  default_tags {
    tags = {
      Proyecto      = "control-asist-ansible"
      GestionadoPor = "Terraform"
    }
  }
}