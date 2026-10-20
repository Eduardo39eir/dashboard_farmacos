# SIGIR · painel com o design Ventek

Adaptação do projeto `ventek---clínica-de-psicologia.zip` fornecido pelo autor. Reutiliza a linguagem visual, Tailwind, Motion, fonte Plus Jakarta Sans (servida localmente), cabeçalho horizontal com seleção animada, cards `sirion-card`, métricas, composição dos gráficos e padrões de tabelas/formulários. O domínio clínico foi substituído por estoque de fármacos. Não inclui pacientes fictícios, prontuários, pagamentos ou integração de IA da clínica.

## Executar localmente

O `app.py` permanece **idêntico ao original do ZIP TCC** e utiliza seu MySQL local.

1. Na raiz do repositório, prepare o ambiente Python, instale `requirements.txt` e configure o `.env` com `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME` e `JWT_SECRET_KEY` conforme `.env.example`.
2. Inicie a API: `python app.py`. Ela deve escutar na porta 5000.
3. Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

4. Acesse a porta **3000** em seu navegador local. O painel inclui a tela de login. Use as credenciais existentes no seu banco. Não abra os templates antigos para acessar este novo design.

O Vite encaminha `/api` para `http://127.0.0.1:5000`; não é necessário alterar rotas nem servir React pelo Flask. Para outro destino, configure `API_BACKEND_URL` no ambiente do Vite e reinicie-o. Essa variável é uma configuração do servidor de desenvolvimento e nunca deve conter senha. Nenhuma credencial do banco deve entrar no frontend.

## Funcionalidades

- Login, expiração de sessão e saída local do painel.
- Dashboard calculado a partir de `/api/lotes`, `/api/farmacos`, `/api/fornecedores` e `/api/movimentacoes` do backend original.
- Filtros de 7, 30 e 90 dias, entradas/saídas, gráfico com tooltip e exportação CSV dos valores do período.
- Calendário de validade por dia e lista de lotes pendentes de atenção, sem números simulados.
- Telas de fornecedores, fármacos, lotes e movimentações com busca, paginação, criação, edição, exclusão/inativação e CSV dos resultados da busca.
- Confirmação com senha para inativar fornecedores; erros e validações retornados pela API são mostrados no formulário.
- Layout responsivo, menu móvel, modais nativos com foco e animações que respeitam movimento reduzido.

A disponibilidade exclui lotes vencidos ou ainda não fabricados e dependências inativas. O limite de alerta é de 10 dias, incluindo o dia do vencimento. O período altera o gráfico; os cards superiores são totais e o calendário mostra os vencimentos do dia selecionado. A data é calculada no navegador. A tela recebe listas completas da API, portanto busca, paginação e agregações são locais; grandes volumes poderão exigir paginação/agregação no backend em outra tarefa.

## Verificar

```bash
cd frontend
npm run build
npm run typecheck
```

O teste de navegador verifica as rotas reais do `app.py` original com um banco SQLite isolado **apenas no processo de testes**, sem editar o arquivo original e sem conectar ao MySQL pessoal. Para executá-lo, use a `.venv` da raiz com `requirements-dev.txt` e Chromium instalados. Em um terminal, inicie o Vite com `API_BACKEND_URL=http://127.0.0.1:5001 npm run dev` (no PowerShell, defina a variável com `$env:API_BACKEND_URL`). Em outro terminal, na raiz:

```bash
.venv/bin/pytest frontend/tests --confcutdir=frontend/tests --rootdir=frontend -q
```

A porta 5001 é reservada para a API de teste. Não aponte esse teste para dados pessoais. Os testes antigos em `tests/` pertencem ao backend anterior e continuam fora desta validação. A conexão com seu MySQL local precisa ser verificada no seu computador.

`npm run build` produz `dist/`. `npm run preview` permite verificar o build local com o mesmo proxy da API. Publicação em produção requer um servidor estático e encaminhamento `/api` ao Flask; não foi realizada nesta tarefa.

## Fidelidade ao projeto enviado

A tela inicial reutiliza diretamente a estrutura e as classes de `Header`, `PsychologistGreetingHeader`, `PsychologistQuickMetrics`, `PsychologistClinicalOverviewChart`, `PsychologistTodayScheduleCard`, `PsychologistProntuariosPendingCard` e `PatientAvatar` do ZIP. Mantém os quatro cards, o gráfico com resumos e pendências na coluna de 8/12, o calendário/lista na coluna de 4/12, a seleção animada do menu e os parâmetros de animação Motion. Foram trocados o conteúdo e a fonte de dados para o SIGIR. O card azul grande, o gráfico de rosca e a faixa adicional de atualização da adaptação anterior foram removidos.
