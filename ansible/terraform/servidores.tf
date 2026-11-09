# Imagen: Ubuntu 24.04 más reciente
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

# Los 3 servidores y su portero y disco
locals {
  servidores = {
    db       = { sg = aws_security_group.db.id, disco = 10 }
    backend  = { sg = aws_security_group.backend.id, disco = 12 }
    frontend = { sg = aws_security_group.frontend.id, disco = 8 }
  }
}

# Un solo bloque crea los 3 (for_each). Nacen VACÍOS: los configura Ansible.
resource "aws_instance" "servidor" {
  for_each = local.servidores

  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.publica.id
  vpc_security_group_ids = [each.value.sg]
  key_name               = aws_key_pair.selena.key_name

  # Seguridad: IMDSv2 obligatorio
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  # Seguridad: disco cifrado
  root_block_device {
    volume_size = each.value.disco
    volume_type = "gp3"
    encrypted   = true
  }

  lifecycle {
    ignore_changes = [ami]
  }

  tags = {
    Name = "${var.proyecto}-${each.key}"
    Rol  = each.key
  }
}