#!/bin/bash
# Instalación base del servidor BACKEND: Python + PostgreSQL
set -e

# 1 GB de memoria virtual extra (t3.micro tiene solo 1 GB de RAM)
if [ ! -f /swapfile ]; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
  python3 python3-venv python3-dev build-essential \
  libpq-dev postgresql postgresql-contrib unzip

# PostgreSQL arranca y solo escucha dentro del propio servidor (localhost)
systemctl enable --now postgresql