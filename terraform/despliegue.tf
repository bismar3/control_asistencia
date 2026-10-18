# ---------- 1) Comprimir tu código ----------

# Backend Django: sin entornos virtuales, git ni archivos locales
data "archive_file" "backend" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/.build/backend.zip"
  excludes = [
    "venv", ".venv", "env", ".git", ".idea", ".vscode",
    "__pycache__", "node_modules", "db.sqlite3", ".env", "media",
  ]
}

# Frontend: solo el resultado de "npm run build"
data "archive_file" "frontend" {
  type        = "zip"
  source_dir  = "${path.module}/../frontend/dist"
  output_path = "${path.module}/.build/frontend.zip"
}

# ---------- 2 y 3) Subir y ejecutar el BACKEND ----------
resource "terraform_data" "desplegar_backend" {
  # Se repite si cambia el servidor o tu código
  triggers_replace = [
    aws_instance.backend.id,
    data.archive_file.backend.output_sha,
  ]

  # Cómo entrar al servidor
  connection {
    type        = "ssh"
    user        = "ubuntu"
    host        = aws_instance.backend.public_ip
    private_key = file(pathexpand(var.ruta_llave_privada))
    timeout     = "5m"
  }

  # Sube tu código
  provisioner "file" {
    source      = data.archive_file.backend.output_path
    destination = "/tmp/backend.zip"
  }

  # Sube la configuración (datos de PostgreSQL, clave secreta...)
  provisioner "file" {
    content = templatefile("${path.module}/scripts/app.env.tftpl", {
      db_nombre      = var.db_nombre
      db_usuario     = var.db_usuario
      db_password    = var.db_password
      secret_key     = var.django_secret_key
      frontend_ip    = aws_instance.frontend.public_ip
      django_wsgi    = var.django_wsgi
      puerto_backend = var.puerto_backend
    })
    destination = "/tmp/app.env"
  }

  # Sube el script que instala tu proyecto
  provisioner "file" {
    source      = "${path.module}/scripts/desplegar_backend.sh"
    destination = "/tmp/desplegar_backend.sh"
  }

  # Lo ejecuta
  provisioner "remote-exec" {
    inline = ["sudo bash /tmp/desplegar_backend.sh"]
  }
}

# ---------- 2 y 3) Subir el FRONTEND a Nginx ----------
resource "terraform_data" "desplegar_frontend" {
  triggers_replace = [
    aws_instance.frontend.id,
    data.archive_file.frontend.output_sha,
  ]

  connection {
    type        = "ssh"
    user        = "ubuntu"
    host        = aws_instance.frontend.public_ip
    private_key = file(pathexpand(var.ruta_llave_privada))
    timeout     = "5m"
  }

  provisioner "file" {
    source      = data.archive_file.frontend.output_path
    destination = "/tmp/frontend.zip"
  }

  provisioner "remote-exec" {
    inline = [
      "cloud-init status --wait > /dev/null || true",
      "sudo rm -rf /var/www/app/*",
      "sudo unzip -oq /tmp/frontend.zip -d /var/www/app",
      "sudo chown -R www-data:www-data /var/www/app",
      "sudo systemctl reload nginx",
      "rm -f /tmp/frontend.zip",
      "echo '>> Frontend publicado'",
    ]
  }

  # Primero el backend, así la app ya responde cuando abras la web
  depends_on = [terraform_data.desplegar_backend]
}