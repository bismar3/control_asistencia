# ---------------- Portero del FRONTEND ----------------
resource "aws_security_group" "frontend" {
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
resource "aws_security_group" "backend" {
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