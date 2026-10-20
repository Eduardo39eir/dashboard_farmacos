# SIGIR · Medicina Nuclear UNESP

Controle de estoque de fármacos com Flask, SQLAlchemy e MySQL local. O painel segue a referência visual Youcare: superfície central clara, menu horizontal, cards compactos, destaque azul e gráficos suaves.

## Executar no seu computador

1. Prepare o ambiente Python e instale as dependências:

```bash
python -m venv .venv
# Ative a .venv conforme seu sistema.
pip install -r requirements.txt -c requirements.lock
```

2. Copie `.env.example` para `.env` e configure `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME` e `JWT_SECRET_KEY`. O banco MySQL deve existir e estar disponível.
3. Inicie:

```bash
python run.py
```

4. Abra **http://localhost:5000/** e faça login com os usuários do seu banco.

**O `app.py` original permanece intacto.** `run.py` acrescenta somente o serviço das páginas do painel ao backend existente. Ele importa o original, que mantém sua inicialização de tabelas e usuário inicial.

A interface compilada está em `static/painel/`, incluída no repositório; você não precisa iniciar Node para usar o sistema. Todos os caminhos antigos (`dashboard.html`, `templates/html/dashboard.html`, `templates/html/estoque.html` etc.) agora carregam esta mesma interface. Os templates antigos com menu lateral foram substituídos.

Se ainda usar Live Server nas portas 5500/5501, as requisições da interface serão encaminhadas ao Flask da mesma máquina na porta 5000. A execução recomendada é `python run.py`, com interface e API no mesmo endereço. Não abra os arquivos como `file://`.

## Editar o frontend

```bash
cd frontend
npm ci
npm run dev
```

O Vite informa o endereço de desenvolvimento, terminado em `/static/painel/`, e encaminha `/api` ao Flask na porta 5000. Para gerar a interface usada pelo Python:

```bash
npm run build
```

O build atualiza `static/painel/` e os seis templates de entrada automaticamente. Não edite esses arquivos gerados manualmente. Consulte [frontend/README.md](frontend/README.md).

## Fluxos disponíveis

- Login e sessão administrativa.
- Fornecedores e fármacos: cadastro, edição, busca e inativação.
- Lotes: fabricação, validade, quantidade, capacidade e controle de estoque.
- Entradas e saídas, edição e exclusão com reversão do saldo pelo backend original.
- Gráficos de fluxo e barras, filtro de período/operação, próximos vencimentos, informações do estoque e fornecedores.
- Exportação CSV e layout responsivo.

A disponibilidade exclui lotes vencidos, ainda não fabricados ou com dependências inativas. Alertas consideram lotes com saldo vencidos ou com até 10 dias de validade. A API original é preservada; esta tarefa não migrou dados para Supabase.

## Validação

O build inclui a verificação de TypeScript. O teste em `frontend/tests/` exercita a interface com as rotas reais do backend e SQLite isolado apenas no processo de teste; não acessa o MySQL pessoal. As rotas antigas também são verificadas para impedir que a interface anterior reapareça. Os testes antigos em `tests/` pertencem ao backend anterior e não validam esta versão restaurada.
