# SIGIR UNESP · Controle de estoque de fármacos

Projeto de TCC para gerenciamento do estoque da Medicina Nuclear da UNESP. Mantém Python/Flask, modelos SQLAlchemy, HTML, CSS e JavaScript do projeto original. Banco de produção: **PostgreSQL no Supabase**. SQLite serve apenas para desenvolvimento e testes sem credenciais externas.

## Executar localmente

Requer Python 3.12 ou superior. No diretório do projeto:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt -c requirements.lock
cp .env.example .env
```

Edite `.env`: gere `JWT_SECRET_KEY` com `python -c "import secrets; print(secrets.token_hex(32))"`. Para testar sem Supabase use `DATABASE_URL=sqlite:///desenvolvimento.db`. Para Supabase siga [o guia](docs/SUPABASE.md).

```bash
flask --app app init-db
flask --app app create-admin
flask --app app run --host=0.0.0.0 --port=5000
```

O comando `create-admin` solicita nome, e-mail e senha oculta com confirmação (mínimo de 12 caracteres). Não há usuário ou senha padrão. Abra a raiz do servidor para entrar. As páginas e a API são servidas pelo Flask; não use Live Server nem abra os arquivos HTML diretamente.

Em produção Linux, instale `requirements.txt` com `-c requirements.lock` e execute `gunicorn --bind 0.0.0.0:5000 --workers 2 --access-logfile - app:app` atrás de um proxy HTTPS. A configuração de infraestrutura e a publicação da aplicação são etapas separadas. `GET /health` verifica a conexão do banco; não testa autenticação ou existência das tabelas.

## Funcionalidades

- Login JWT com validade de 8 horas, controle de acesso administrativo e tratamento de sessão expirada.
- Cadastro/edição de fornecedores, fármacos e lotes; inativação de itens.
- Entradas e saídas com limites de saldo/capacidade; edição e exclusão revertem o saldo na mesma transação. Bloqueios de linhas no PostgreSQL protegem movimentações concorrentes.
- Dashboard responsivo: unidades disponíveis, lotes, fármacos e histórico total.
- Gráfico de entradas/saídas por dia com filtros de 7, 30 e 90 dias e tabela acessível.
- Quantidade disponível por fármaco, distribuição de validade e alertas de lotes com saldo próximos do vencimento ou vencidos.
- Últimas movimentações do período e exportação CSV da série diária exibida.

Os indicadores de estoque consideram lotes já fabricados com lote, fármaco e fornecedor ativos. Unidades disponíveis excluem vencidos; a distribuição de validade inclui vencidos para acompanhamento. A data de validade é inclusiva e o alerta usa o limite original de 10 dias. Os dias são calculados pelo relógio do servidor. Fármacos cadastrados e histórico de movimentações nos cards são contagens totais; o filtro altera o fluxo e as últimas movimentações.

## Testar

```bash
source .venv/bin/activate
pytest -q
```

Os testes usam SQLite em memória e nunca acessam o banco configurado no `.env`. Cobrem permissões, login, cadastros, movimentações/reversões, dashboard e comandos administrativos. Com Chromium instalado, também verificam navegação, gráficos, filtros, CSV e layout móvel em navegador real. Sem Chromium, esse teste aparece explicitamente como ignorado. Instale Chromium pelo gerenciador de pacotes do sistema para executá-lo.

## Organização

- `app.py`: configuração, rotas e comandos administrativos.
- `models/`: modelos originais de usuário, fornecedor, fármaco, lote e movimentação.
- `dashboard_service.py`: agregações dos indicadores.
- `templates/html/`, `static/css/`, `static/js/`: interface organizada por página.
- `docs/SUPABASE.md`: conexão e inicialização do PostgreSQL.
- `scripts/setup.sh`: preparação repetível do ambiente Codex em `/workspace/dashboard_farmacos`.

A importação utiliza a pasta principal `TCC/` do ZIP, que contém os fluxos mais completos. A cópia antiga `TCC/TCC/`, o ambiente virtual Windows, arquivos `.env` e configurações pessoais não são publicados. O ZIP não contém um dump dos dados do MySQL; os registros existentes não são transferidos automaticamente.

## Limites desta versão

O login permanece no Flask com a tabela `usuarios`; não usa Supabase Auth. O Supabase hospeda o banco, acessado somente pelo backend. Logout remove o token no navegador; um token copiado continua válido até expirar. Antes de disponibilizar na Internet, configure HTTPS, limitação de tentativas de login, backups e política de expiração/revogação conforme o uso da instituição. Não existe cadastro público nem recuperação de senha nesta versão.
