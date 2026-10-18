# Control de Asistencia — Despliegue en AWS con Terraform

Sistema de control de asistencia (Django + React) desplegado en AWS mediante
**infraestructura como código** con Terraform. El *state* de Terraform vive en
un bucket S3 compartido, con bloqueo (*lock*) para que dos personas no apliquen
cambios al mismo tiempo.

## Arquitectura

```
Usuario ──HTTP──► EC2 Frontend (Nginx + React)
                        │  /graphql, /admin, /media
                        ▼  (red privada 10.20.x.x)
                  EC2 Backend (Django + Gunicorn + PostgreSQL)
```

- **Región:** us-east-2 (Ohio)
- **Red:** VPC propia `10.20.0.0/16` con una subred pública
- **Frontend:** Nginx sirve React y reenvía `/graphql`, `/admin`, `/media` y `/static` al backend
- **Backend:** solo acepta tráfico del frontend (puerto 8000); PostgreSQL vive en el mismo servidor
- **State de Terraform:** bucket S3 `control-asist-tfstate-487003832843`, cifrado, con versionado y lock

## Estructura del repositorio

```
control_asist/
├── backend/                     # Django (API GraphQL)
├── frontend/                    # React + Vite
└── terraform/
    ├── bootstrap/               # Crea el bucket S3 del state (se ejecuta UNA vez)
    ├── scripts/                 # Scripts de instalación de los servidores
    ├── backend.tf               # Indica que el state vive en S3
    ├── providers.tf             # Proveedores AWS y Archive
    ├── variables.tf             # Variables configurables
    ├── red.tf                   # VPC, subred, gateway, rutas
    ├── seguridad.tf             # Security Groups
    ├── servidores.tf            # Las dos instancias EC2
    ├── despliegue.tf            # Sube y ejecuta el código en los servidores
    ├── outputs.tf               # URLs y comandos SSH al terminar
    └── terraform.tfvars.example # Plantilla de variables (sin secretos)
```

## Qué archivos van a Git

| Archivo | ¿A Git? | Motivo |
|---|---|---|
| `*.tf` | Sí | Es el código |
| `.terraform.lock.hcl` | Sí | Fija las versiones exactas de los providers |
| `terraform.tfvars.example` | Sí | Plantilla sin secretos |
| `.terraform/` | No | Providers descargados (cientos de MB) |
| `*.tfstate`, `*.tfstate.backup` | **Nunca** | Contienen secretos; el state vive en S3 |
| `terraform.tfvars` | **Nunca** | Contiene contraseñas |

Los `.gitignore` ya protegen estos archivos.

## Requisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) 1.10 o superior
- [AWS CLI](https://aws.amazon.com/cli/) configurado con un usuario IAM propio (`aws configure`)
- Node.js (para compilar el frontend)
- Git

## Primera vez (nuevo integrante del equipo)

1. Clonar el repositorio:
```powershell
   git clone https://github.com/bismar3/control_asistencia.git
   cd control_asistencia
```
2. Configurar AWS con **tus propias** credenciales (pedir al dueño de la cuenta un usuario IAM):
```powershell
   aws configure          # región: us-east-2
   aws sts get-caller-identity
```
3. Compilar el frontend (la carpeta `dist` no está en Git):
```powershell
   cd frontend
   npm install
   npm run build
   cd ..
```
4. Crear tu archivo de variables a partir de la plantilla:
```powershell
   cd terraform
   copy terraform.tfvars.example terraform.tfvars
```
   Llenar `terraform.tfvars` con los valores reales. **Los secretos se piden al
   equipo por un medio privado, nunca por GitHub.**
5. Inicializar Terraform (se conecta al state en S3):
```powershell
   terraform init
   terraform plan
```
   Si todo está bien, el plan dirá **No changes** (o solo cambios en los Outputs).

## Flujo de trabajo en equipo

**Antes de trabajar:**
```powershell
git pull
cd terraform
terraform plan
```

**Para aplicar un cambio:**
```powershell
terraform plan       # revisar SIEMPRE: "0 to destroy" y sin "must be replaced"
terraform apply
```

**Después de aplicar:**
```powershell
git add .
git commit -m "Descripción del cambio"
git push
```

Si otra persona está aplicando cambios al mismo tiempo, Terraform mostrará
`Acquiring state lock...` y esperará. **No usar** `terraform force-unlock` salvo
que estén seguros de que nadie más está trabajando.

## Encender y apagar los servidores

Las IPs públicas cambian cada vez que se apagan y encienden los servidores.

**Encender:**
1. Consola AWS → EC2 → Instancias → seleccionar ambas → *Iniciar instancia*
2. Si cambió tu IP (`curl.exe https://checkip.amazonaws.com`), actualizar `ips_permitidas`
   en `terraform.tfvars` y ejecutar `terraform apply`
3. Ver las IPs nuevas: `terraform apply -refresh-only`
4. Abrir la `url_de_tu_app` con `http://` delante

**Apagar:** Consola AWS → EC2 → Instancias → seleccionar ambas → *Detener instancia*

## Reglas importantes

- Antes de escribir `yes`, leer el plan. Si aparece `must be replaced` o algo en
  `to destroy`, **cancelar** y revisar.
- **No ejecutar** `terraform destroy` sin acuerdo del equipo: borra los servidores
  y la base de datos.
- **No borrar** el bucket del state ni la carpeta `bootstrap/`.