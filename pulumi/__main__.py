"""
VM en AWS creada con Pulumi (Python).
Tarea: "Aprovisionar una VM usando Pulumi".
El state de este proyecto se guarda en el mismo bucket S3 que el de Terraform.
"""

import pulumi
import pulumi_aws as aws

proyecto = "control-asist-pulumi"

# ---------------------------------------------------------------------
# 1) Imagen: busca la versión más reciente de Ubuntu 24.04 (no crea nada)
#    Equivale al bloque  data "aws_ami" "ubuntu"  de Terraform
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

# Puerta hacia Internet
igw = aws.ec2.InternetGateway(
    "igw",
    vpc_id=vpc.id,
    tags={"Name": f"{proyecto}-igw"},
)

# Subred pública donde vivirá la VM
subred = aws.ec2.Subnet(
    "subred-publica",
    vpc_id=vpc.id,
    cidr_block="10.30.1.0/24",
    availability_zone="us-east-2a",
    map_public_ip_on_launch=True,
    tags={"Name": f"{proyecto}-subred-publica"},
)

# Tabla de ruteo: "todo lo que vaya a Internet, mándalo por el IGW"
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
    description="HTTP publico para la VM de Pulumi",
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
# 4) Script que se ejecuta al encender la VM: instala Nginx y una página
# ---------------------------------------------------------------------
script_inicio = """#!/bin/bash
apt-get update -y
apt-get install -y nginx
cat > /var/www/html/index.html <<'EOF'
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>VM con Pulumi</title></head>
<body style="font-family:sans-serif;text-align:center;margin-top:80px">
  <h1>VM creada con Pulumi</h1>
  <p>Proyecto control_asistencia - Infraestructura como codigo con Python</p>
</body>
</html>
EOF
systemctl enable nginx
systemctl restart nginx
"""

# ---------------------------------------------------------------------
# 5) La máquina virtual
# ---------------------------------------------------------------------
vm = aws.ec2.Instance(
    "vm",
    ami=ami.id,
    instance_type="t3.micro",
    subnet_id=subred.id,
    vpc_security_group_ids=[portero.id],
    user_data=script_inicio,
    tags={"Name": f"{proyecto}-vm"},
)

# ---------------------------------------------------------------------
# 6) Salidas: lo que Pulumi muestra al terminar (como outputs.tf)
# ---------------------------------------------------------------------
pulumi.export("id_vm", vm.id)
pulumi.export("ip_publica", vm.public_ip)
pulumi.export("url", vm.public_ip.apply(lambda ip: f"http://{ip}"))