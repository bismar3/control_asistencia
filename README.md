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

---

## VM con Pulumi (Python)

Además de Terraform, el proyecto incluye una VM creada con **Pulumi** usando **Python**,
en la carpeta `pulumi/`. Es independiente de los servidores de la aplicación: crea su
propia red (`10.30.0.0/16`), un Security Group que abre el puerto 80 y una EC2 Ubuntu
con Nginx que muestra una página de prueba.

El *state* de Pulumi se guarda en **el mismo bucket S3** que el de Terraform, en su
propia carpeta:

```
control-asist-tfstate-487003832843/
├── control-asist/terraform.tfstate        ← state de Terraform
└── pulumi/.pulumi/stacks/...              ← state de Pulumi (stack "dev")
```

### Comparación con Terraform

| | Terraform | Pulumi |
|---|---|---|
| Lenguaje | HCL (`.tf`) | Python (`__main__.py`) |
| Ver cambios | `terraform plan` | `pulumi preview` |
| Crear / actualizar | `terraform apply` | `pulumi up` |
| Borrar | `terraform destroy` | `pulumi destroy` |
| Dónde se indica el state | `backend.tf` | `pulumi login s3://...` |

### Requisitos

- [Pulumi](https://www.pulumi.com/docs/install/) (`winget install Pulumi.Pulumi`)
- Python 3.10 o superior
- AWS CLI configurado con un usuario IAM de la cuenta del proyecto
- La **frase de cifrado** del stack (`PULUMI_CONFIG_PASSPHRASE`). **Se pide al equipo
  por un medio privado; nunca se escribe en el repositorio.**

### Primera vez

```powershell
cd pulumi

# 1. Configurar la terminal (repetir cada vez que se abre una terminal nueva)
$env:AWS_PROFILE = "control-asist"                 # perfil con acceso a la cuenta del proyecto
$env:PULUMI_CONFIG_PASSPHRASE = "PEDIR_AL_EQUIPO"  # frase de cifrado del stack
$env:PULUMI_SELF_MANAGED_STATE_LOCKING = "1"       # activa el candado del state

# 2. Conectarse al state en S3
pulumi login "s3://control-asist-tfstate-487003832843/pulumi?region=us-east-2"

# 3. Instalar las librerías de Python (la carpeta venv no está en Git)
pulumi install

# 4. Elegir el stack y comprobar
pulumi stack select dev
pulumi preview
```

### Uso diario

```powershell
cd pulumi
$env:AWS_PROFILE = "control-asist"
$env:PULUMI_CONFIG_PASSPHRASE = "PEDIR_AL_EQUIPO"
$env:PULUMI_SELF_MANAGED_STATE_LOCKING = "1"

pulumi preview      # ver qué va a cambiar
pulumi up           # crear la VM (elegir "yes" con las flechas)
pulumi stack output # ver la IP y la URL
pulumi destroy      # borrar la VM al terminar (no borrar el stack)
```

Al terminar `pulumi up`, abrir la `url` con `http://` delante: debe mostrar
**"VM creada con Pulumi"**. Esperar 1 o 2 minutos si todavía no carga (Nginx se está
instalando).

### Qué archivos de `pulumi/` van a Git

| Archivo | ¿A Git? | Motivo |
|---|---|---|
| `__main__.py` | Sí | El código de la infraestructura |
| `Pulumi.yaml` | Sí | Nombre y datos del proyecto |
| `Pulumi.dev.yaml` | Sí | Configuración del stack (región). Su `encryptionsalt` no es secreto |
| `requirements.txt` | Sí | Librerías de Python necesarias |
| `venv/` | **No** | Librerías instaladas; se regeneran con `pulumi install` |
| Frase de cifrado | **Nunca** | Sin ella no se puede abrir el state |