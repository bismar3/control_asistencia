# Llave SSH: la parte PÚBLICA de tu llave de Ubuntu
resource "aws_key_pair" "selena" {
  key_name   = "${var.proyecto}-selena"
  public_key = file("${path.module}/llave-selena.pub")
}

# --- FRONTEND: web pública ---
resource "aws_security_group" "frontend" {
  name        = "${var.proyecto}-sg-frontend"
  description = "Web publica (80) y SSH desde mi IP"
  vpc_id      = aws_vpc.principal.id

  ingress {
    description = "HTTP desde cualquier lugar"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH solo desde mi IP (Ansible)"
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

  tags = { Name = "${var.proyecto}-sg-frontend" }
}

# --- BACKEND: Django solo desde el frontend ---
resource "aws_security_group" "backend" {
  name        = "${var.proyecto}-sg-backend"
  description = "Django solo desde el frontend y SSH desde mi IP"
  vpc_id      = aws_vpc.principal.id

  ingress {
    description     = "Django solo desde el frontend"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  ingress {
    description = "SSH solo desde mi IP (Ansible)"
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

  tags = { Name = "${var.proyecto}-sg-backend" }
}

# --- BASE DE DATOS: PostgreSQL solo desde el backend ---
resource "aws_security_group" "db" {
  name        = "${var.proyecto}-sg-db"
  description = "PostgreSQL solo desde el backend y SSH desde mi IP"
  vpc_id      = aws_vpc.principal.id

  ingress {
    description     = "PostgreSQL solo desde el backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  ingress {
    description = "SSH solo desde mi IP (Ansible)"
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

  tags = { Name = "${var.proyecto}-sg-db" }
}