# ---------------- Portero del FRONTEND ----------------
# Excepción (Trivy AWS-0104): el servidor necesita salida a internet para instalar paquetes.
#trivy:ignore:AWS-0104
resource "aws_security_group" "frontend" {
  # checkov:skip=CKV_AWS_260: El puerto 80 debe estar abierto al publico porque es la pagina web del sistema
  # checkov:skip=CKV_AWS_382: El servidor necesita salida a internet para instalar paquetes (apt) y actualizaciones

  name        = "${var.proyecto}-sg-frontend"
  description = "Web publica (80/443) y SSH desde mi IP"
  vpc_id      = aws_vpc.principal.id

  ingress {
    description = "HTTP desde cualquier lugar"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS desde cualquier lugar"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH solo desde mi IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ips_permitidas
  }

  egress {
    description = "Salida libre (instalar paquetes)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.proyecto}-sg-frontend" }
}

# ---------------- Portero del BACKEND ----------------
# Excepción (Trivy AWS-0104): el servidor necesita salida a internet para instalar paquetes (apt, pip).
#trivy:ignore:AWS-0104
resource "aws_security_group" "backend" {
  # checkov:skip=CKV_AWS_382: El servidor necesita salida a internet para instalar paquetes (apt, pip)

  name        = "${var.proyecto}-sg-backend"
  description = "Django solo desde el frontend y SSH desde mi IP"
  vpc_id      = aws_vpc.principal.id

  ingress {
    description     = "Django solo desde el servidor frontend"
    from_port       = var.puerto_backend
    to_port         = var.puerto_backend
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  ingress {
    description = "SSH solo desde mi IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ips_permitidas
  }

  egress {
    description = "Salida libre (instalar paquetes)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.proyecto}-sg-backend" }
}

# ---------------- Security Group por defecto de la VPC ----------------
# Toda VPC trae un Security Group "default". Nosotros no lo usamos,
# así que lo dejamos SIN reglas: nadie puede usarlo por error.
# (corrige CKV2_AWS_12)
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.principal.id

  tags = { Name = "${var.proyecto}-sg-default-bloqueado" }
}