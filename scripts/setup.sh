#!/usr/bin/env bash
set -euo pipefail
cd /workspace/dashboard_farmacos
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt -c requirements.lock
# Backend original: requer configuração do MySQL local pelo usuário.
# Não importa app.py durante setup: o original cria tabelas e usuário ao importar.
