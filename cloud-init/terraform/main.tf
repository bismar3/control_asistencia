# =====================================================================
# VM en AWS creada con TERRAFORM y configurada con CLOUD-INIT
# Usa el archivo compartido ../cloud-config.yaml
# =====================================================================

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # El state se guarda en el mismo bucket S3, en otra "carpeta" (key)
  backend "s3" {
    bucket       = "control-asist-tfstate-487003832843"
    key          = "cloud-init/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-east-2"

  default_tags {
    tags = {
      Proyecto      = "cloud-init"
      GestionadoPor = "Terraform"
    }
  }
}

# ---------------- Variables ----------------
variable "ip_permitida" {
  description = "Tu IP publica con /32 al final, para entrar por SSH"
  type        = string
}

# ---------------- Datos que se consultan (no se crean) ----------------

# La red por defecto de la cuenta
data "aws_vpc" "por_defecto" {
  default = true
}

# La imagen más reciente de Ubuntu 24.04
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical, dueño oficial de Ubuntu

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

# ---------------- Portero (Security Group) ----------------
resource "aws_security_group" "web" {
  name        = "cloud-init-terraform-sg"
  description = "Web publica (80) y SSH desde mi IP"
  vpc_id      = data.aws_vpc.por_defecto.id

  ingress {
    description = "HTTP desde cualquier lugar"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH solo desde mi IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ip_permitida]
  }

  egress {
    description = "Salida libre (instalar paquetes)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "cloud-init-terraform-sg" }
}

# ---------------- La VM ----------------
resource "aws_instance" "vm" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = "control-asist-llave" # la llave SSH que ya existe

  # ⭐ CLOUD-INIT: lee el archivo compartido, cambia el hueco por "Terraform"
  #    y se lo entrega a AWS. Al encender la VM, cloud-init lo ejecuta.
  #    (El segundo replace quita los saltos de línea de Windows, por si acaso)
  user_data = replace(
    replace(file("${path.module}/../cloud-config.yaml"), "__HERRAMIENTA__", "Terraform"),
    "\r\n", "\n"
  )

  # Seguridad: IMDSv2 obligatorio
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  # Seguridad: disco cifrado
  root_block_device {
    volume_size = 8
    volume_type = "gp3"
    encrypted   = true
  }

  tags = { Name = "cloud-init-terraform" }
}

# ---------------- Salidas ----------------
output "url" {
  description = "Abre esta direccion en el navegador"
  value       = "http://${aws_instance.vm.public_ip}"
}

output "ssh" {
  description = "Comando para entrar por SSH"
  value       = "ssh -i ~/.ssh/id_ed25519 ubuntu@${aws_instance.vm.public_ip}"
}