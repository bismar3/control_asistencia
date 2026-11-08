# =====================================================================
# main.tf - Punto de entrada del proyecto control_asist
# =====================================================================
# Terraform lee todos los archivos .tf de esta carpeta juntos.
# Para que sea fácil de leer, el código está separado por temas:
#
#   providers.tf   -> Proveedor AWS y región (Ohio, us-east-2)
#   backend.tf     -> State remoto en S3 con bloqueo (use_lockfile)
#   variables.tf   -> Datos de entrada del proyecto
#   red.tf         -> VPC, subred pública, Internet Gateway y rutas
#   seguridad.tf   -> Security Groups del frontend y del backend
#   servidores.tf  -> Instancias EC2: backend (Django) y frontend (React)
#   vm_demo.tf     -> VM de prueba para la demostración del equipo
#   despliegue.tf  -> Sube el código del proyecto a las instancias
#   outputs.tf     -> URLs e IPs que se muestran al terminar
# =====================================================================