"""
VMs en AWS creadas con Pulumi (Python).
Tarea: "Aprovisionar una VM usando Pulumi".
El state de este proyecto se guarda en el mismo bucket S3 que el de Terraform.

Ventaja de Pulumi frente a Terraform: al ser Python, podemos usar un ciclo
"for" para crear una VM por cada integrante del equipo.
"""

import pulumi
import pulumi_aws as aws

proyecto = "control-asist-pulumi"

# Una VM por cada integrante. Para agregar a alguien, solo añade su nombre aquí.
integrantes = ["selena", "bismark"]

# ---------------------------------------------------------------------
# 1) Imagen: busca la versión más reciente de Ubuntu 24.04 (no crea nada)
# ---------------------------------------------------------------------
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["099720109477"],  # Canonical, dueño oficial de Ubuntu
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"],
        )
    ],
)

# ---------------------------------------------------------------------
# 2) Red: VPC propia (10.30.x.x para no chocar con Terraform, que usa 10.20.x.x)
# ---------------------------------------------------------------------
vpc = aws.ec2.Vpc(
    "vpc",
    cidr_block="10.30.0.0/16",
    enable_dns_support=True,
    enable_dns_hostnames=True,
    tags={"Name": f"{proyecto}-vpc"},
)

igw = aws.ec2.InternetGateway(
    "igw",
    vpc_id=vpc.id,
    tags={"Name": f"{proyecto}-igw"},
)

subred = aws.ec2.Subnet(
    "subred-publica",
    vpc_id=vpc.id,
    cidr_block="10.30.1.0/24",
    availability_zone="us-east-2a",
    map_public_ip_on_launch=True,
    tags={"Name": f"{proyecto}-subred-publica"},
)

tabla_ruteo = aws.ec2.RouteTable(
    "rt-publica",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
        )
    ],
    tags={"Name": f"{proyecto}-rt-publica"},
)

aws.ec2.RouteTableAssociation(
    "rt-asociacion",
    subnet_id=subred.id,
    route_table_id=tabla_ruteo.id,
)

# ---------------------------------------------------------------------
# 3) Seguridad: "portero" que solo deja entrar la web (puerto 80)
# ---------------------------------------------------------------------
portero = aws.ec2.SecurityGroup(
    "portero-web",
    vpc_id=vpc.id,
    description="HTTP publico para las VMs de Pulumi",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTP desde cualquier lugar",
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            description="Salida libre",
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
        )
    ],
    tags={"Name": f"{proyecto}-sg-web"},
)

# ---------------------------------------------------------------------
# 4) NUEVO: una VM por cada integrante, usando un ciclo "for"
# ---------------------------------------------------------------------
def script_inicio(nombre):
    """Script que se ejecuta al encender la VM: instala Nginx y una página."""
    return f"""#!/bin/bash
apt-get update -y
apt-get install -y nginx
cat > /var/www/html/index.html <<'EOF'
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>VM de {nombre}</title></head>
<body style="font-family:sans-serif;text-align:center;margin-top:80px">
  <h1>VM de {nombre}</h1>
  <p>Creada con Pulumi (Python) - Proyecto control_asistencia</p>
</body>
</html>
EOF
systemctl enable nginx
systemctl restart nginx
"""


for nombre in integrantes:
    vm = aws.ec2.Instance(
        f"vm-{nombre}",
        ami=ami.id,
        instance_type="t3.micro",
        subnet_id=subred.id,
        vpc_security_group_ids=[portero.id],
        user_data=script_inicio(nombre),
        tags={"Name": f"{proyecto}-vm-{nombre}"},
    )

    # Salidas de cada VM (como outputs.tf)
    pulumi.export(f"ip_{nombre}", vm.public_ip)
    pulumi.export(f"url_{nombre}", vm.public_ip.apply(lambda ip: f"http://{ip}"))