#!/usr/bin/env bash
set -euo pipefail
cd /workspace/dashboard_farmacos
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt -c requirements.lock
# Não sobrescreve configurações existentes e não salva credenciais em arquivos versionados.
.venv/bin/python - <<'PY'
from pathlib import Path
import os
import secrets
arquivo = Path('.env')
if not arquivo.exists():
    linhas = []
    if not os.getenv('JWT_SECRET_KEY'):
        linhas.append('JWT_SECRET_KEY=' + secrets.token_hex(32))
    if not os.getenv('DATABASE_URL'):
        linhas.append('DATABASE_URL=sqlite:///desenvolvimento.db')
    if linhas:
        arquivo.write_text('\n'.join(linhas) + '\n')
        arquivo.chmod(0o600)
PY
# Cria somente o banco de desenvolvimento local. Supabase requer inicialização explícita.
.venv/bin/python - <<'PY'
from app import app, db
with app.app_context():
    if db.engine.dialect.name == 'sqlite':
        db.create_all()
        print('Banco local de desenvolvimento preparado; nenhum usuário padrão foi criado.')
PY
