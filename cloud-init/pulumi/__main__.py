"""
VM en AWS creada con PULUMI (Python) y configurada con CLOUD-INIT.
Usa el archivo compartido ../cloud-config.yaml
"""

from pathlib import Path

import pulumi
import pulumi_aws as aws

# ---------------- Configuración (como las variables de Terraform) ----------------
config = pulumi.Config()
ip_permitida = config.require("ip_permitida")  # tu IP con /32

# ---------------- Datos que se consultan (no se crean) ----------------

# La red por defecto de la cuenta
vpc = aws.ec2.get_vpc(default=True)

# La imagen más reciente de Ubuntu 24.04
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

# ---------------- ⭐ CLOUD-INIT ----------------
# Lee el archivo compartido (una carpeta arriba), cambia el hueco por "Pulumi"
# y quita los saltos de línea de Windows, por si acaso.
archivo = Path(__file__).parent.parent / "cloud-config.yaml"
cloud_config = (
    archivo.read_text(encoding="utf-8")
    .replace("__HERRAMIENTA__", "Pulumi")
    .replace("\r\n", "\n")
)

# ---------------- Portero (Security Group) ----------------
portero = aws.ec2.SecurityGroup(
    "portero-web",
    name="cloud-init-pulumi-sg",
    description="Web publica (80) y SSH desde mi IP",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTP desde cualquier lugar",
            protocol="tcp", from_port=80, to_port=80,
            cidr_blocks=["0.0.0.0/0"],
        ),
        aws.ec2.SecurityGroupIngressArgs(
            description="SSH solo desde mi IP",
            protocol="tcp", from_port=22, to_port=22,
            cidr_blocks=[ip_permitida],
        ),
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            description="Salida libre (instalar paquetes)",
            protocol="-1", from_port=0, to_port=0,
            cidr_blocks=["0.0.0.0/0"],
        )
    ],
    tags={"Name": "cloud-init-pulumi-sg", "Proyecto": "cloud-init"},
)

# ---------------- La VM ----------------
vm = aws.ec2.Instance(
    "vm",
    ami=ami.id,
    instance_type="t3.micro",
    vpc_security_group_ids=[portero.id],
    key_name="control-asist-llave",  # la llave SSH que ya existe
    user_data=cloud_config,          # ⭐ se lo entrega a cloud-init
    # Seguridad: IMDSv2 obligatorio
    metadata_options=aws.ec2.InstanceMetadataOptionsArgs(
        http_endpoint="enabled",
        http_tokens="required",
    ),
    # Seguridad: disco cifrado
    root_block_device=aws.ec2.InstanceRootBlockDeviceArgs(
        volume_size=8,
        volume_type="gp3",
        encrypted=True,
    ),
    tags={"Name": "cloud-init-pulumi", "Proyecto": "cloud-init"},
)

# ---------------- Salidas ----------------
pulumi.export("url", vm.public_ip.apply(lambda ip: f"http://{ip}"))
pulumi.export("ssh", vm.public_ip.apply(lambda ip: f"ssh -i ~/.ssh/id_ed25519 ubuntu@{ip}"))