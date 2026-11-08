# Consulta las zonas disponibles de Ohio (no crea nada)
data "aws_availability_zones" "disponibles" {
  # checkov:skip=CKV_AWS_394: Solo es una consulta; usamos siempre la primera zona y la region esta fija (us-east-2)

  state = "available"
}

# La red privada propia del proyecto
# Excepción (Trivy AWS-0178): los Flow Logs requieren CloudWatch y cuestan dinero.
#trivy:ignore:AWS-0178
resource "aws_vpc" "principal" {
  # checkov:skip=CKV2_AWS_11: Los VPC Flow Logs requieren CloudWatch y cuestan dinero; no se justifican en un proyecto academico

  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.proyecto}-vpc" }
}

# La puerta hacia Internet
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.principal.id

  tags = { Name = "${var.proyecto}-igw" }
}

# Subred pública donde vivirán los dos servidores
# Excepción (Trivy AWS-0164): subred pública a propósito; no usamos NAT ni balanceador para no gastar.
#trivy:ignore:AWS-0164
resource "aws_subnet" "publica" {
  # checkov:skip=CKV_AWS_130: Subred publica a proposito; los servidores necesitan IP publica (no usamos NAT ni balanceador para no generar costos)

  vpc_id                  = aws_vpc.principal.id
  cidr_block              = "10.20.1.0/24"
  availability_zone       = data.aws_availability_zones.disponibles.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "${var.proyecto}-subred-publica" }
}

# "Todo lo que vaya a Internet (0.0.0.0/0), mándalo por el IGW"
resource "aws_route_table" "publica" {
  vpc_id = aws_vpc.principal.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = { Name = "${var.proyecto}-rt-publica" }
}

resource "aws_route_table_association" "publica" {
  subnet_id      = aws_subnet.publica.id
  route_table_id = aws_route_table.publica.id
}