# =====================================================================
# VM de demostración: la "tercera máquina" del ejemplo del docente.
# Bismark la agrega al código; Selena la crea desde su PC.
# Terraform solo creará ESTA, porque el state en S3 ya sabe
# que el backend y el frontend existen.
# =====================================================================

resource "aws_instance" "demo" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.publica.id
  vpc_security_group_ids = [aws_security_group.frontend.id]
  key_name               = aws_key_pair.llave.key_name

  # No reemplazarla si sale una imagen nueva de Ubuntu
  lifecycle {
    ignore_changes = [ami]
  }

  tags = { Name = "${var.proyecto}-demo" }
}