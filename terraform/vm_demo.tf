# =====================================================================
# vm_demo.tf - VM de prueba para la demostración del equipo
# Bismark la agregó al código; Selena la aplica desde su PC.
# Reutiliza la red, el portero del frontend y la llave que ya existen,
# por eso el plan solo muestra "1 to add".
# =====================================================================

resource "aws_instance" "demo" {
  # checkov:skip=CKV_AWS_126: VM temporal de demostracion; el monitoreo detallado cuesta dinero
  # checkov:skip=CKV_AWS_135: Las instancias t3 ya vienen optimizadas para EBS por defecto
  # checkov:skip=CKV2_AWS_41: La VM no usa servicios de AWS; sin rol IAM se aplica minimo privilegio

  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.publica.id
  vpc_security_group_ids = [aws_security_group.frontend.id]
  key_name               = aws_key_pair.llave.key_name

  # Seguridad: obliga a usar IMDSv2 (corrige CKV_AWS_79)
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  # Seguridad: disco cifrado (corrige CKV_AWS_8)
  root_block_device {
    encrypted = true
  }

  lifecycle {
    ignore_changes = [ami]
  }

  tags = {
    Name = "${var.proyecto}-demo"
  }
}