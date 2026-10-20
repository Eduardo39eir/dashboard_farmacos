# Frontend SIGIR

Interface baseada na referência Youcare fornecida pelo autor. Preserva React, Tailwind, Motion, Recharts e a fonte local Plus Jakarta Sans do projeto anterior. A tela principal usa menu horizontal, quadro central claro, quatro cards compactos na primeira linha e três blocos na segunda, com destaque azul e gráficos de traço leve.

## Desenvolvimento

Na raiz, configure o MySQL conforme `.env.example` e inicie `python run.py`.

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Acesse o endereço do Vite em `/static/painel/`. A variável de servidor `API_BACKEND_URL` permite alterar o destino da API (padrão: `http://127.0.0.1:5000`). Nunca inclua credenciais do banco no frontend.

## Build integrado

```bash
npm run build
```

O build verifica TypeScript, gera `../static/painel/` e copia o documento de entrada para os seis arquivos `../templates/html/*.html`. Assim, os endereços antigos deixam de mostrar o menu lateral. Tanto o build quanto os templates resultantes são incluídos no Git para execução com Python sem instalar Node.

`app.py` segue original; `run.py` registra apenas as páginas e utiliza as rotas `/api` já existentes. Se o projeto estiver aberto em Live Server 5500/5501, a interface usa a API na porta 5000 da mesma máquina. Respostas HTML inesperadas exibem uma orientação clara, sem expor erros do parser JSON.

Os gráficos usam listas completas da API, com agrupamentos, busca e paginação locais. O filtro de período/operação altera os gráficos; os totais de disponibilidade usam o estoque completo. O gráfico de barras divide o período em seis intervalos.

## Testes

Instale as dependências Python de desenvolvimento e Chromium. Inicie o Vite em um terminal com `API_BACKEND_URL=http://127.0.0.1:5001 npm run dev` (no PowerShell, defina a variável com `$env:API_BACKEND_URL`). Na raiz do repositório execute:

```bash
.venv/bin/pytest frontend/tests --confcutdir=frontend/tests --rootdir=frontend -q
```

A API de teste roda na porta 5001 usando SQLite em memória. O teste não modifica `app.py`, não acessa o MySQL pessoal e cobre cadastros, movimentações, reversão de saldo, filtros, CSV, busca, sessão e os pontos de entrada antigos.
