output "url_de_tu_app" {
  description = "Abre esta dirección en el navegador"
  value       = "http://${aws_instance.frontend.public_ip}"
}

output "url_graphql" {
  description = "API GraphQL (pasa por Nginx hacia Django)"
  value       = "http://${aws_instance.frontend.public_ip}/graphql/"
}

output "backend_ip_privada" {
  description = "IP interna por la que el frontend habla con Django"
  value       = aws_instance.backend.private_ip
}

output "ssh_frontend" {
  value = "ssh -i ~/.ssh/id_ed25519 ubuntu@${aws_instance.frontend.public_ip}"
}

output "ssh_backend" {
  value = "ssh -i ~/.ssh/id_ed25519 ubuntu@${aws_instance.backend.public_ip}"
}