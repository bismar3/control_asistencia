# Busca la imagen más reciente de Ubuntu 24.04 (no crea nada)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical, dueño oficial de Ubuntu

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

# Sube la llave PÚBLICA a AWS (la "cerradura")
resource "aws_key_pair" "llave" {
  key_name   = "${var.proyecto}-llave"
  public_key = file(pathexpand(var.ruta_llave_publica))

  # No reemplazar la llave si otro compañero tiene un archivo .pub distinto
  lifecycle {
    ignore_changes = [public_key]
  }
}

# ======================= SERVIDOR BACKEND =======================
resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.tipo_instancia
  subnet_id              = aws_subnet.publica.id
  vpc_security_group_ids = [aws_security_group.backend.id]
  key_name               = aws_key_pair.llave.key_name

  # Instalación base: Python + PostgreSQL
  user_data = file("${path.module}/scripts/base_backend.sh")

  root_block_device {
    volume_size = 12
    volume_type = "gp3"
  }

  # No reemplazar el servidor si sale otra imagen de Ubuntu
  # o si cambia el script de instalación inicial
  lifecycle {
    ignore_changes = [ami, user_data]
  }

  tags = { Name = "${var.proyecto}-backend" }
}

# ======================= SERVIDOR FRONTEND =======================
resource "aws_instance" "frontend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.tipo_instancia
  subnet_id              = aws_subnet.publica.id
  vpc_security_group_ids = [aws_security_group.frontend.id]
  key_name               = aws_key_pair.llave.key_name

  # Instalación base: Nginx, configurado con la IP PRIVADA del backend
  user_data = templatefile("${path.module}/scripts/base_frontend.sh.tftpl", {
    backend_ip     = aws_instance.backend.private_ip
    puerto_backend = var.puerto_backend
  })

  root_block_device {
    volume_size = 8
    volume_type = "gp3"
  }

  lifecycle {
    ignore_changes = [ami, user_data]
  }

  tags = { Name = "${var.proyecto}-frontend" }
}