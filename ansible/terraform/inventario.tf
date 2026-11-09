# Inventario de Ansible: Terraform lo escribe solo, con las IPs reales
resource "local_file" "inventario" {
  filename = "${path.module}/../playbook/inventario.ini"
  content = templatefile("${path.module}/inventario.tftpl", {
    db_publica       = aws_instance.servidor["db"].public_ip
    db_privada       = aws_instance.servidor["db"].private_ip
    backend_publica  = aws_instance.servidor["backend"].public_ip
    backend_privada  = aws_instance.servidor["backend"].private_ip
    frontend_publica = aws_instance.servidor["frontend"].public_ip
    frontend_privada = aws_instance.servidor["frontend"].private_ip
  })
}