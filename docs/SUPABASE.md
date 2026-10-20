# Configurar o Supabase

## 1. Criar o projeto

Crie um projeto no painel do Supabase e guarde a senha do banco no seu gerenciador de senhas. Em **Connect**, copie a URI PostgreSQL de **Session pooler** (porta 5432), apropriada para servidores Flask persistentes e redes IPv4. Não confunda a senha do banco com a chave pública/anon do projeto.

## 2. Configurar o backend

Em `.env` local ou nas variáveis seguras do ambiente onde Flask será executado:

```dotenv
DATABASE_URL=postgresql+psycopg://postgres.PROJECT_REF:SENHA_CODIFICADA@HOST_DO_SESSION_POOLER:5432/postgres?sslmode=require
JWT_SECRET_KEY=CHAVE_ALEATORIA_COM_PELO_MENOS_32_CARACTERES
```

Use o usuário e host exatos fornecidos pelo painel. Codifique caracteres especiais da senha para uso em URL. `postgres://` e `postgresql://` também são aceitos e normalizados para o driver psycopg. A conexão PostgreSQL exige TLS (`sslmode=require`). O driver usa `pool_pre_ping`, timeout de conexão e prepared statements desativados para compatibilidade com o pooler.

Não envie senha/URL completa pelo chat nem coloque credenciais no GitHub ou no JavaScript. No ambiente Codex, use uma variável de ambiente segura para `DATABASE_URL`: a conexão PostgreSQL precisa do valor real, não de uma chave substituída por proxy HTTPS. Se houver restrição de rede, o host do pooler e conexões PostgreSQL na porta 5432 precisam estar disponíveis; liberar apenas HTTPS não basta.

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` não são necessárias nesta arquitetura. A autenticação continua no Flask.

## 3. Inicializar um banco novo

Depois de configurar a conexão, na pasta do projeto com o ambiente virtual ativado:

```bash
flask --app app init-db
flask --app app create-admin
```

`init-db` cria apenas as tabelas ausentes; não transforma tabelas existentes. No Supabase ele também ativa RLS e revoga o acesso de `anon` e `authenticated` às tabelas da aplicação. O backend usa o usuário administrativo do banco fornecido pelo painel, que ignora RLS. Não configure a API pública do Supabase para acessar as tabelas sem uma revisão de autorização; os hashes das senhas devem permanecer privados. O comando espera as roles padrão do Supabase e deve ser executado com o usuário administrativo do projeto.

Reinicie o servidor após mudar variáveis. Verifique `/health`, faça login e cadastre fornecedor → fármaco → lote → movimentação. Confira o saldo e o dashboard. Os testes automatizados locais não comprovam a conexão ao seu projeto Supabase.

## Dados do banco local

O ZIP contém código, mas não os registros do MySQL. Para levar dados existentes será necessário um export separado do banco local. Não apague o MySQL original: faça backup, migre primeiro em um projeto de homologação e confira IDs, chaves estrangeiras, datas, saldos e hashes de senha antes de usar em produção. Esta versão não executa migração automática dos dados locais nem altera esquemas preexistentes.
