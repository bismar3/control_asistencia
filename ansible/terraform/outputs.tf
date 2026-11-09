# Lo que se muestra al terminar
output "ips_publicas" {
  description = "IP publica de cada servidor"
  value       = { for k, s in aws_instance.servidor : k => s.public_ip }
}

output "ips_privadas" {
  description = "IP privada de cada servidor (asi se hablan entre ellos)"
  value       = { for k, s in aws_instance.servidor : k => s.private_ip }
}

output "url_app" {
  description = "Abre esta direccion cuando Ansible termine"
  value       = "http://${aws_instance.servidor["frontend"].public_ip}"
}