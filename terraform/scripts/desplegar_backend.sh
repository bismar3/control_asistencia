#!/bin/bash
# Despliegue del proyecto Django en el servidor BACKEND
set -e

echo ">> 1. Esperando a que termine la instalación base..."
cloud-init status --wait > /dev/null || true

# Quita saltos de línea de Windows, por si acaso
sed -i 's/\r$//' /tmp/app.env

# Carga las variables (DB_NAME, DB_PASSWORD, PORT...)
set -a; source /tmp/app.env; set +a

APP=/opt/app
SRC=$APP/src

echo ">> 2. Copiando el código..."
rm -rf "$SRC"
mkdir -p "$SRC"
unzip -oq /tmp/backend.zip -d "$SRC"
install -m 600 /tmp/app.env "$APP/app.env"
mkdir -p "$SRC/media"

echo ">> 3. Preparando PostgreSQL..."
cd /tmp
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE "$DB_USER" LOGIN PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER ROLE "$DB_USER" WITH LOGIN PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
fi

echo ">> 4. Instalando dependencias de Python..."
[ -d "$APP/venv" ] || python3 -m venv "$APP/venv"
"$APP/venv/bin/pip" install --upgrade pip -q
"$APP/venv/bin/pip" install -r "$SRC/requirements.txt" -q
"$APP/venv/bin/pip" install gunicorn -q

echo ">> 5. Creando tablas (migrate) y archivos estáticos..."
cd "$SRC"
"$APP/venv/bin/python" manage.py migrate --noinput
"$APP/venv/bin/python" manage.py collectstatic --noinput || echo "(collectstatic omitido)"

chown -R ubuntu:ubuntu "$APP"

echo ">> 6. Dejando Django corriendo como servicio..."
cat > /etc/systemd/system/django.service <<EOF
[Unit]
Description=Django control_asist (Gunicorn)
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=$SRC
EnvironmentFile=$APP/app.env
ExecStart=$APP/venv/bin/gunicorn $DJANGO_WSGI:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable django
systemctl restart django

rm -f /tmp/backend.zip /tmp/app.env
sleep 3
systemctl is-active django && echo ">> Backend corriendo en el puerto $PORT"