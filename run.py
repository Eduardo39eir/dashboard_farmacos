"""Serve o painel e a API juntos, preservando integralmente o app.py original."""
from pathlib import Path
import os
from flask import send_file, abort

RAIZ = Path(__file__).resolve().parent
PAGINAS = {'index', 'dashboard', 'estoque', 'farmacos', 'fornecedores', 'movimentacoes'}


def registrar_painel(aplicacao):
    def painel(pagina='index'):
        if pagina not in PAGINAS:
            abort(404)
        arquivo = RAIZ / 'static' / 'painel' / 'index.html'
        if not arquivo.is_file():
            return 'Gere o painel com: cd frontend && npm ci && npm run build', 503
        return send_file(arquivo)

    aplicacao.add_url_rule('/', 'painel_inicio', painel)
    aplicacao.add_url_rule('/<pagina>.html', 'painel_pagina', painel)
    aplicacao.add_url_rule('/templates/html/<pagina>.html', 'painel_compatibilidade', painel)


if __name__ == '__main__':
    # Importa o backend somente ao iniciar, após o usuário configurar seu MySQL.
    from app import app
    registrar_painel(app)
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5000')), debug=False)
