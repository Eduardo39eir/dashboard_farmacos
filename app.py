from flask import Flask, render_template
from database import db

from models.usuario import Usuario
from models.fornecedor import Fornecedor
from models.farmaco import Farmaco
from models.lote import Lote
from models.movimentacao import Movimentacao

from flask import request, jsonify

# Importa a biblioteca para criptografar senhas.
from werkzeug.security import generate_password_hash, check_password_hash


import click
from sqlalchemy import text
from sqlalchemy.engine import make_url
from dashboard_service import montar_dashboard

# importa abiblioteca para autenticação de Token da Web (JWT).
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt

# Importa a bibliotea para manipular datas.
from datetime import date, datetime, timedelta

# Importa os módulos para manipular variáveis de ambiente.
from dotenv import load_dotenv
import os

app = Flask (__name__)

# Habilita o back-end a responder solicitações do front-end.
# Front-end e API são servidos pela mesma aplicação.

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Supabase usa PostgreSQL; SQLite é exclusivo para desenvolvimento e testes locais.
conexao = os.getenv("DATABASE_URL", "sqlite:///desenvolvimento.db")
if conexao.startswith(("postgres://", "postgresql://")):
    conexao = "postgresql+psycopg://" + conexao.split("://", 1)[1]
url_banco = make_url(conexao)
app.config["SQLALCHEMY_DATABASE_URI"] = url_banco
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
if url_banco.get_backend_name() == "postgresql":
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "connect_args": {"sslmode": "require", "connect_timeout": 10,
                         "prepare_threshold": None},
    }

# Uma chave persistente é obrigatória; nunca versionar seu valor.
chave_jwt = os.getenv("JWT_SECRET_KEY", "")
if len(chave_jwt) < 32:
    raise RuntimeError("Configure JWT_SECRET_KEY com pelo menos 32 caracteres no ambiente.")
app.config["JWT_SECRET_KEY"] = chave_jwt
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

# Inicializa o gerenciador de Tokens da web (jWT).
jwt = JWTManager(app)

# Vincula o banco de dados à aplicação da web.
db.init_app(app)


def obter_status_validade(data_validade, hoje=None):
    hoje = hoje or date.today()
    dias_para_vencer = (data_validade - hoje).days

    if dias_para_vencer < 0:
        return "Vencido"
    if dias_para_vencer <= 10:
        return "Quase vencendo"
    return "Ativo"

# Preparação explícita: importar o app não altera o banco e não cria usuários padrão.
@app.cli.command("init-db")
def inicializar_banco():
    """Cria as tabelas em um banco novo. Não migra esquemas existentes."""
    db.create_all()
    if db.engine.dialect.name == "postgresql":
        # A API Flask autentica o acesso; os clientes Supabase não acessam as tabelas.
        for tabela in db.metadata.sorted_tables:
            db.session.execute(text(f'ALTER TABLE "{tabela.name}" ENABLE ROW LEVEL SECURITY'))
            db.session.execute(text(f'REVOKE ALL ON TABLE "{tabela.name}" FROM anon, authenticated'))
        db.session.commit()
    click.echo("Tabelas criadas com sucesso.")


@app.cli.command("create-admin")
@click.option("--nome", prompt=True)
@click.option("--email", prompt=True)
@click.password_option("--senha", confirmation_prompt=True)
def criar_administrador(nome, email, senha):
    """Cria o primeiro administrador sem senha padrão."""
    if len(senha) < 12:
        raise click.ClickException("Use uma senha com pelo menos 12 caracteres.")
    if Usuario.query.filter_by(email=email).first():
        raise click.ClickException("Este e-mail já está cadastrado.")
    db.session.add(Usuario(nome=nome, email=email,
                          senha=generate_password_hash(senha), administrador=True))
    db.session.commit()
    click.echo("Administrador criado.")


@app.route("/")
@app.route("/index.html")
def pagina_login():
    return render_template("html/index.html")


@app.route("/<pagina>.html")
@app.route("/templates/html/<pagina>.html")
def pagina_aplicacao(pagina):
    if pagina not in {"index", "dashboard", "estoque", "farmacos", "fornecedores", "movimentacoes"}:
        from flask import abort
        abort(404)
    return render_template(f"html/{pagina}.html")


@app.route("/health")
def verificar_saude():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({"status": "ok"})
    except Exception:
        db.session.rollback()
        return jsonify({"status": "indisponivel"}), 503


@app.before_request
def validar_corpo_json():
    if request.path.startswith("/api/") and request.method in {"POST", "PUT"} and request.path != "/api/logout":
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"erro": "Envie um objeto JSON válido."}), 400


# _________
# Rota para login usuário.
@app.route('/api/login', methods=['POST'])
def tela_login():

     # Recebe os dados do front-end.
    dados = request.get_json()
    email = dados.get("email")
    senha = dados.get("senha")
    if not isinstance(email, str) or not isinstance(senha, str) or not email or not senha:
        return jsonify({"error": "Informe e-mail e senha."}), 400

     # Bsuca o usuario no banco de dados pelo cpf.
    usuarios = Usuario.query.filter_by(email=email).first()

     #Verifica se o usuário existe e se a senha está correta.
    if not usuarios or not check_password_hash(usuarios.senha, senha):

        #Login incorreto.
        return jsonify({"error": "Email ou senha inválidos."}), 401

    else:

        # Login correto.
        token = create_access_token(
            identity=str(usuarios.id_usuario),
            additional_claims={
                "administrador": usuarios.administrador
            }
        )

        return jsonify({"token": token}),200

# Rota para logout de usuario.
@app.route("/api/logout", methods=["POST"])
@jwt_required()
def logout():

    return jsonify({"message": "Logout realizado com sucesso."}), 200

@app.route('/home')
def dashboard():
    return render_template("html/dashboard.html")


# __________________________________________________________________________________________________________________

@app.route("/api/dashboard", methods=["GET"])
@jwt_required()
def obter_dashboard():
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    try:
        try:
            dias = int(request.args.get("dias", "30"))
        except ValueError:
            return jsonify({"erro": "Período inválido."}), 400
        if dias not in (7, 30, 90):
            return jsonify({"erro": "Selecione 7, 30 ou 90 dias."}), 400
        resultado = montar_dashboard(dias)
        return jsonify(resultado), 200
    except Exception:
        return jsonify({"erro": "Ocorreu um erro ao carregar o dashboard."}), 500

# ________________________


# __________________________________________________________________________________________________________________

# POST
@app.route("/api/fornecedores", methods=["POST"])
@jwt_required()
def criar_fornecedor():
    # Verifica se o usuário é um administrador.
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    dados = request.get_json()
    nome=dados.get("nome")
    cnpj=dados.get("cnpj")
    telefone=dados.get("telefone")
    email=dados.get("email")

    if not all(isinstance(valor, str) and valor.strip() for valor in (nome, cnpj, telefone, email)):
        return jsonify({"erro": "Nome, CNPJ, telefone e e-mail são obrigatórios."}), 400
    if Fornecedor.query.filter_by(email=email).first():
        return jsonify({"erro": "E-mail já cadastrado."}), 409

    try:
        # Verifica se o fornecedor já existe no banco de dados.
        if Fornecedor.query.filter_by(cnpj=cnpj).first():
            return jsonify({"error": "Fornecedor já existe."}), 409

        else:
            novo_fornecedor = Fornecedor(
                nome=nome,
                cnpj=cnpj,
                telefone=telefone,
                email=email
            )
            db.session.add(novo_fornecedor)
            db.session.commit()
            return jsonify({"message": "Fornecedor criado com sucesso."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Ocorreu um erro ao criar o fornecedor."}), 500

# __________________________________________________________________________________________________________________

#________________________
# GET
@app.route("/api/fornecedores", methods=["GET"])
@jwt_required()
def listar_fornecedores():

    claims = get_jwt()

    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    try:
        incluir_inativos = request.args.get("incluir_inativos", "").lower() == "true"
        consulta = Fornecedor.query
        if not incluir_inativos:
            consulta = consulta.filter_by(status=True)
        fornecedores = consulta.all()

        resultado = [{
            "id": fornecedor.id,
            "nome": fornecedor.nome,
            "cnpj": fornecedor.cnpj,
            "telefone": fornecedor.telefone,
            "email": fornecedor.email,
            "status": fornecedor.status
        } for fornecedor in fornecedores]

        return jsonify(resultado), 200

    except Exception as e:
        # print(e)
        return jsonify({"error": "Ocorreu um erro ao buscar os fornecedores."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

@app.route("/api/fornecedores/<int:id>", methods=["PUT"])
@jwt_required()
def atualizar_fornecedor(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    fornecedor = db.session.get(Fornecedor, id)
    if not fornecedor:
        return jsonify({"erro": "Fornecedor não encontrado."}), 404

    dados = request.get_json() or {}
    nome = dados.get("nome", fornecedor.nome)
    cnpj = dados.get("cnpj", fornecedor.cnpj)
    telefone = dados.get("telefone", fornecedor.telefone)
    email = dados.get("email", fornecedor.email)

    try:
        fornecedor_existente = Fornecedor.query.filter(Fornecedor.cnpj == cnpj, Fornecedor.id != id).first()
        if fornecedor_existente:
            return jsonify({"erro": "Já existe outro fornecedor com este CNPJ."}), 409

        fornecedor_existente_email = Fornecedor.query.filter(Fornecedor.email == email, Fornecedor.id != id).first()
        if fornecedor_existente_email:
            return jsonify({"erro": "Já existe outro fornecedor com este e-mail."}), 409

        fornecedor.nome = nome
        fornecedor.cnpj = cnpj
        fornecedor.telefone = telefone
        fornecedor.email = email
        db.session.commit()

        return jsonify({"message": "Fornecedor atualizado com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao atualizar o fornecedor."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

@app.route("/api/fornecedores/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir_fornecedor(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    fornecedor = db.session.get(Fornecedor, id)
    if not fornecedor:
        return jsonify({"erro": "Fornecedor não encontrado."}), 404

    dados = request.get_json(silent=True) or {}
    senha = dados.get("senha")
    if not senha:
        return jsonify({"erro": "Informe sua senha de confirmação para excluir."}), 400

    from flask_jwt_extended import get_jwt_identity
    usuario_id = get_jwt_identity()
    usuario = db.session.get(Usuario, int(usuario_id))
    if not usuario or not check_password_hash(usuario.senha, senha):
        return jsonify({"erro": "Senha incorreta. A exclusão não foi realizada."}), 401

    try:
        fornecedor.status = False

        # Inativa em cascata todos os fármacos e lotes vinculados a este fornecedor
        farmacos = Farmaco.query.filter_by(id_fornecedor=id).all()
        for farmaco in farmacos:
            farmaco.status = False
            lotes = Lote.query.filter_by(id_farmaco=farmaco.id).all()
            for lote in lotes:
                lote.status = False

        db.session.commit()
        return jsonify({"message": "Fornecedor e todos os seus fármacos e lotes vinculados foram excluídos com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao excluir o fornecedor."}), 500

# __________________________________________________________________________________________________________________


#_______________________________________________________________
# POST farmaco

@app.route("/api/farmacos", methods=["POST"])
@jwt_required()
def criar_farmaco():
    # Verifica se o usuário é um administrador.
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    dados = request.get_json()
    nome = dados.get("nome")
    id_fornecedor = dados.get("id_fornecedor")

    try:
        if not nome or id_fornecedor is None:
            return jsonify({
                "erro": "Nome e fornecedor são obrigatórios."
            }), 400

        try:
            id_fornecedor = int(id_fornecedor)
        except (TypeError, ValueError):
            return jsonify({"erro": "Fornecedor inválido."}), 400

        if not db.session.get(Fornecedor, id_fornecedor):
            return jsonify({"erro": "Fornecedor não encontrado."}), 404

        # O mesmo nome é permitido para fornecedores diferentes.
        farmaco_existente = Farmaco.query.filter_by(
            nome=nome,
            id_fornecedor=id_fornecedor
        ).first()
        if farmaco_existente:
            return jsonify({
                "erro": "Já existe um fármaco com este nome para este fornecedor."
            }), 409

        novo_farmaco = Farmaco(
            nome=nome,
            id_fornecedor=id_fornecedor
        )
        db.session.add(novo_farmaco)
        db.session.commit()
        return jsonify({
            "message": "Fármaco criado com sucesso.",
            "id": novo_farmaco.id
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao criar o fármaco."}), 500
# _______________________________________________________________________________________________


# _______________________________________________________________________________________________
#Get farmaco

@app.route("/api/farmacos", methods=["GET"])
@jwt_required()
def listar_farmacos():

    claims = get_jwt()

    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    try:

        incluir_inativos = request.args.get("incluir_inativos", "").lower() == "true"
        consulta_farmacos = Farmaco.query
        if not incluir_inativos:
            consulta_farmacos = consulta_farmacos.filter_by(status=True)
        farmacos = consulta_farmacos.all()
        hoje = date.today()

        resultado = []
        for farmaco in farmacos:
            todos_lotes_ativos = Lote.query.filter(
                Lote.id_farmaco == farmaco.id,
                Lote.status.is_(True)
            ).all()
            lotes_ativos = [
                lote for lote in todos_lotes_ativos
                if lote.data_fabricacao <= hoje
            ]
            lotes_ativos.sort(key=lambda lote: lote.data_validade)

            lote_atual = next(
                (lote for lote in lotes_ativos if lote.data_validade >= hoje),
                None
            )
            status_validade = (
                obter_status_validade(lote_atual.data_validade, hoje)
                if lote_atual
                else ("Vencido" if lotes_ativos else "Sem lote")
            )

            resultado.append({
                "id": farmaco.id,
                "nome": farmaco.nome,
                "id_fornecedor": farmaco.id_fornecedor,
                "fornecedor": farmaco.fornecedor.nome,
                "status": farmaco.status,
                "status_validade": status_validade
            })

        return jsonify(resultado), 200

    except Exception as e:
        # print(e)
        return jsonify({"error": "Ocorreu um erro ao buscar os fármacos."}), 500


# __________________________________________________________________________________________________________________

# _____________________________________________________________________________________
# PUT farmaco
@app.route("/api/farmacos/<int:id>", methods=["PUT"])
@jwt_required()
def atualizar_farmaco(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    farmaco = db.session.get(Farmaco, id)
    if not farmaco:
        return jsonify({"erro": "Fármaco não encontrado."}), 404

    dados = request.get_json() or {}
    nome = dados.get("nome", farmaco.nome)
    id_fornecedor = dados.get("id_fornecedor", farmaco.id_fornecedor)

    try:
        if not nome:
            return jsonify({"erro": "Nome e fornecedor são obrigatórios."}), 400

        try:
            id_fornecedor = int(id_fornecedor)
        except (TypeError, ValueError):
            return jsonify({"erro": "Fornecedor inválido."}), 400

        if not db.session.get(Fornecedor, id_fornecedor):
            return jsonify({"erro": "Fornecedor não encontrado."}), 404

        farmaco_existente = Farmaco.query.filter(
            Farmaco.nome == nome,
            Farmaco.id_fornecedor == id_fornecedor,
            Farmaco.id != id
        ).first()
        if farmaco_existente:
            return jsonify({
                "erro": "Já existe um fármaco com este nome para este fornecedor."
            }), 409

        farmaco.nome = nome
        farmaco.id_fornecedor = id_fornecedor
        db.session.commit()

        return jsonify({"message": "Fármaco atualizado com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao atualizar o fármaco."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# DELETE farmaco
@app.route("/api/farmacos/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir_farmaco(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    farmaco = db.session.get(Farmaco, id)
    if not farmaco:
        return jsonify({"erro": "Fármaco não encontrado."}), 404

    try:
        farmaco.status = False
        lotes = Lote.query.filter_by(id_farmaco=id).all()
        for lote in lotes:
            lote.status = False
        db.session.commit()
        return jsonify({"message": "Fármaco e seus lotes inativados com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao excluir o fármaco."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

@app.route("/api/farmacos/<int:id>/status", methods=["PATCH"])
@jwt_required()
def alterar_status_farmaco(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    farmaco = db.session.get(Farmaco, id)
    if not farmaco:
        return jsonify({"erro": "Fármaco não encontrado."}), 404

    try:
        farmaco.status = not farmaco.status
        db.session.commit()
        mensagem = "Fármaco ativado com sucesso." if farmaco.status else "Fármaco inativado com sucesso."
        return jsonify({"message": mensagem}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao alterar o status do fármaco."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# POST lote
@app.route("/api/lotes", methods=["POST"])
@jwt_required()
def criar_lote():
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    dados = request.get_json() or {}
    try:
        id_farmaco = int(dados.get("id_farmaco"))
        quantidade = int(dados.get("quantidade"))
        capacidade = int(dados.get("capacidade"))
        data_fabricacao = date.fromisoformat(dados.get("data_fabricacao"))
        data_validade = date.fromisoformat(dados.get("data_validade"))
    except (TypeError, ValueError):
        return jsonify({"erro": "Dados do lote inválidos."}), 400

    numero_lote = str(dados.get("numero_lote", "")).strip()
    if not numero_lote or quantidade < 0 or capacidade <= 0:
        return jsonify({"erro": "Preencha os dados do lote corretamente."}), 400
    if quantidade > capacidade:
        return jsonify({"erro": "A quantidade não pode ser maior que a capacidade."}), 400
    if data_validade < data_fabricacao:
        return jsonify({"erro": "A validade não pode ser anterior à fabricação."}), 400

    try:
        farmaco = db.session.get(Farmaco, id_farmaco)
        if not farmaco:
            return jsonify({"erro": "Fármaco não encontrado."}), 404
        if not farmaco.status:
            return jsonify({"erro": "Não é possível criar um lote para um fármaco inativo."}), 409

        lote_existente = Lote.query.filter_by(
            id_farmaco=id_farmaco,
            numero_lote=numero_lote
        ).first()
        if lote_existente:
            return jsonify({"erro": "Já existe este número de lote para o fármaco."}), 409

        novo_lote = Lote(
            id_farmaco=id_farmaco,
            numero_lote=numero_lote,
            data_fabricacao=data_fabricacao,
            data_validade=data_validade,
            quantidade=quantidade,
            capacidade=capacidade
        )
        db.session.add(novo_lote)
        db.session.commit()
        return jsonify({
            "message": "Lote criado com sucesso.",
            "id": novo_lote.id
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao criar o lote."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# GET lotes
@app.route("/api/lotes", methods=["GET"])
@jwt_required()
def listar_lotes():
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    try:
        incluir_inativos = request.args.get("incluir_inativos", "").lower() == "true"
        consulta_lotes = Lote.query
        if not incluir_inativos:
            consulta_lotes = consulta_lotes.filter_by(status=True)
        lotes = consulta_lotes.all()
        hoje = date.today()
        resultado = [{
            "id": lote.id,
            "id_farmaco": lote.id_farmaco,
            "farmaco": db.session.get(Farmaco, lote.id_farmaco).nome,
            "numero_lote": lote.numero_lote,
            "data_fabricacao": lote.data_fabricacao.isoformat(),
            "data_validade": lote.data_validade.isoformat(),
            "quantidade": lote.quantidade,
            "capacidade": lote.capacidade,
            "status": lote.status,
            "status_validade": obter_status_validade(lote.data_validade, hoje)
        } for lote in lotes]
        return jsonify(resultado), 200
    except Exception:
        return jsonify({"erro": "Ocorreu um erro ao buscar os lotes."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# PUT lote
@app.route("/api/lotes/<int:id>", methods=["PUT"])
@jwt_required()
def atualizar_lote(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    lote = db.session.get(Lote, id)
    if not lote:
        return jsonify({"erro": "Lote não encontrado."}), 404

    dados = request.get_json() or {}
    try:
        id_farmaco = int(dados.get("id_farmaco", lote.id_farmaco))
        quantidade = int(dados.get("quantidade", lote.quantidade))
        capacidade = int(dados.get("capacidade", lote.capacidade))
        data_fabricacao = date.fromisoformat(
            dados.get("data_fabricacao", lote.data_fabricacao.isoformat())
        )
        data_validade = date.fromisoformat(
            dados.get("data_validade", lote.data_validade.isoformat())
        )
    except (TypeError, ValueError):
        return jsonify({"erro": "Dados do lote inválidos."}), 400

    numero_lote = str(dados.get("numero_lote", lote.numero_lote)).strip()
    if not numero_lote or quantidade < 0 or capacidade <= 0:
        return jsonify({"erro": "Preencha os dados do lote corretamente."}), 400
    if quantidade > capacidade:
        return jsonify({"erro": "A quantidade não pode ser maior que a capacidade."}), 400
    if data_validade < data_fabricacao:
        return jsonify({"erro": "A validade não pode ser anterior à fabricação."}), 400

    try:
        if not db.session.get(Farmaco, id_farmaco):
            return jsonify({"erro": "Fármaco não encontrado."}), 404

        lote_existente = Lote.query.filter(
            Lote.id_farmaco == id_farmaco,
            Lote.numero_lote == numero_lote,
            Lote.id != id
        ).first()
        if lote_existente:
            return jsonify({"erro": "Já existe este número de lote para o fármaco."}), 409

        lote.id_farmaco = id_farmaco
        lote.numero_lote = numero_lote
        lote.data_fabricacao = data_fabricacao
        lote.data_validade = data_validade
        lote.quantidade = quantidade
        lote.capacidade = capacidade
        db.session.commit()
        return jsonify({"message": "Lote atualizado com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao atualizar o lote."}), 500


# __________________________________________________________________________________________________________________

# DELETE lote
@app.route("/api/lotes/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir_lote(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    lote = db.session.get(Lote, id)
    if not lote:
        return jsonify({"erro": "Lote não encontrado."}), 404

    try:
        lote.status = False
        db.session.commit()
        return jsonify({"message": "Lote inativado com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao excluir o lote."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# PATCH status do lote
@app.route("/api/lotes/<int:id>/status", methods=["PATCH"])
@jwt_required()
def alterar_status_lote(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    lote = db.session.get(Lote, id)
    if not lote:
        return jsonify({"erro": "Lote não encontrado."}), 404

    try:
        lote.status = not lote.status
        db.session.commit()
        return jsonify({"message": "Status do lote alterado com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao alterar o status do lote."}), 500



# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# GET movimentações
@app.route("/api/movimentacoes", methods=["GET"])
@jwt_required()
def listar_movimentacoes():
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    try:
        movimentacoes = (
            db.session.query(Movimentacao, Lote, Farmaco, Usuario)
            .join(Lote, Movimentacao.id_lote == Lote.id)
            .join(Farmaco, Lote.id_farmaco == Farmaco.id)
            .join(Usuario, Movimentacao.id_usuario == Usuario.id_usuario)
            .order_by(Movimentacao.data_movimentacao.desc())
            .all()
        )

        resultado = [{
            "id": movimentacao.id,
            "id_lote": movimentacao.id_lote,
            "lote": lote.numero_lote,
            "numero_lote": lote.numero_lote,
            "farmaco": farmaco.nome,
            "id_usuario": movimentacao.id_usuario,
            "usuario": usuario.nome,
            "nome_usuario": usuario.nome,
            "tipo_movimentacao": movimentacao.tipo_movimentacao,
            "quantidade": movimentacao.quantidade,
            "data_movimentacao": movimentacao.data_movimentacao.isoformat(),
            "observacao": movimentacao.observacao
        } for movimentacao, lote, farmaco, usuario in movimentacoes]

        return jsonify(resultado), 200
    except Exception:
        return jsonify({"erro": "Ocorreu um erro ao buscar as movimentações."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# POST movimentação
@app.route("/api/movimentacoes", methods=["POST"])
@jwt_required()
def criar_movimentacao():
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    dados = request.get_json() or {}
    try:
        id_lote = int(dados.get("id_lote"))
        quantidade = int(dados.get("quantidade"))
    except (TypeError, ValueError):
        return jsonify({"erro": "Informe um lote e uma quantidade válidos."}), 400

    tipo = str(dados.get("tipo_movimentacao", "")).strip().lower()
    if tipo not in ("entrada", "saída", "saida") or quantidade <= 0:
        return jsonify({"erro": "Informe o tipo e uma quantidade maior que zero."}), 400

    lote = Lote.query.filter_by(id=id_lote).with_for_update().first()
    if not lote:
        return jsonify({"erro": "Lote não encontrado."}), 404
    if not lote.status:
        return jsonify({"erro": "Não é possível movimentar um lote inativo."}), 409

    if lote.data_fabricacao > date.today() or lote.data_validade < date.today():
        return jsonify({"erro": "Não é possível movimentar um lote fora da validade."}), 409
    farmaco = db.session.get(Farmaco, lote.id_farmaco)
    fornecedor = db.session.get(Fornecedor, farmaco.id_fornecedor)
    if not farmaco.status or not fornecedor.status:
        return jsonify({"erro": "Fármaco ou fornecedor inativo."}), 409

    quantidade_anterior = lote.quantidade
    if tipo == "entrada":
        if lote.quantidade + quantidade > lote.capacidade:
            return jsonify({"erro": "A entrada ultrapassa a capacidade do lote."}), 400
        lote.quantidade += quantidade
    else:
        if quantidade > lote.quantidade:
            return jsonify({"erro": "A saída é maior que a quantidade disponível."}), 400
        lote.quantidade -= quantidade

    movimentacao = Movimentacao(
        id_lote=id_lote,
        id_usuario=int(get_jwt()["sub"]),
        tipo_movimentacao="Entrada" if tipo == "entrada" else "Saída",
        quantidade=quantidade,
        data_movimentacao=datetime.now(),
        observacao=dados.get("observacao")
    )

    try:
        db.session.add(movimentacao)
        db.session.commit()
        return jsonify({
            "message": "Movimentação registrada com sucesso.",
            "id": movimentacao.id,
            "quantidade_anterior": quantidade_anterior,
            "quantidade_atual": lote.quantidade
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao registrar a movimentação."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# PUT movimentação
@app.route("/api/movimentacoes/<int:id>", methods=["PUT"])
@jwt_required()
def atualizar_movimentacao(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    movimentacao = Movimentacao.query.filter_by(id=id).with_for_update().first()
    if not movimentacao:
        return jsonify({"erro": "Movimentação não encontrada."}), 404

    dados = request.get_json() or {}
    try:
        id_lote = int(dados.get("id_lote", movimentacao.id_lote))
        quantidade = int(dados.get("quantidade", movimentacao.quantidade))
    except (TypeError, ValueError):
        return jsonify({"erro": "Informe um lote e uma quantidade válidos."}), 400

    tipo = str(
        dados.get("tipo_movimentacao", movimentacao.tipo_movimentacao)
    ).strip().lower()
    if tipo not in ("entrada", "saída", "saida") or quantidade <= 0:
        return jsonify({"erro": "Informe o tipo e uma quantidade maior que zero."}), 400

    # Ordem fixa dos bloqueios reduz a possibilidade de deadlocks entre lotes.
    lotes_bloqueados = {lote.id: lote for lote in Lote.query.filter(
        Lote.id.in_([id_lote, movimentacao.id_lote])
    ).order_by(Lote.id).with_for_update().all()}
    novo_lote = lotes_bloqueados.get(id_lote)
    if not novo_lote:
        return jsonify({"erro": "Lote não encontrado."}), 404
    if not novo_lote.status or novo_lote.data_fabricacao > date.today() or novo_lote.data_validade < date.today():
        return jsonify({"erro": "O lote precisa estar ativo e dentro da validade."}), 409
    farmaco = db.session.get(Farmaco, novo_lote.id_farmaco)
    fornecedor = db.session.get(Fornecedor, farmaco.id_fornecedor)
    if not farmaco.status or not fornecedor.status:
        return jsonify({"erro": "Fármaco ou fornecedor inativo."}), 409
    lote_antigo = lotes_bloqueados[movimentacao.id_lote]
    saldos = {
        lote_antigo.id: lote_antigo.quantidade,
        novo_lote.id: novo_lote.quantidade
    }

    if movimentacao.tipo_movimentacao == "Entrada":
        saldos[lote_antigo.id] -= movimentacao.quantidade
    else:
        saldos[lote_antigo.id] += movimentacao.quantidade

    if tipo == "entrada":
        saldos[novo_lote.id] += quantidade
    else:
        saldos[novo_lote.id] -= quantidade

    lotes = {lote_antigo.id: lote_antigo, novo_lote.id: novo_lote}
    for lote_id, saldo in saldos.items():
        if saldo < 0 or saldo > lotes[lote_id].capacidade:
            return jsonify({
                "erro": "A alteração deixaria a quantidade do lote fora dos limites permitidos."
            }), 409

    try:
        for lote_id, saldo in saldos.items():
            lotes[lote_id].quantidade = saldo

        movimentacao.id_lote = id_lote
        movimentacao.tipo_movimentacao = (
            "Entrada" if tipo == "entrada" else "Saída"
        )
        movimentacao.quantidade = quantidade
        movimentacao.observacao = dados.get("observacao", movimentacao.observacao)
        db.session.commit()
        return jsonify({"message": "Movimentação atualizada com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao atualizar a movimentação."}), 500

# __________________________________________________________________________________________________________________


# __________________________________________________________________________________________________________________

# DELETE movimentação
@app.route("/api/movimentacoes/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir_movimentacao(id):
    claims = get_jwt()
    if not claims["administrador"]:
        return jsonify({"erro": "Acesso negado!"}), 403

    movimentacao = Movimentacao.query.filter_by(id=id).with_for_update().first()
    if not movimentacao:
        return jsonify({"erro": "Movimentação não encontrada."}), 404

    lote = Lote.query.filter_by(id=movimentacao.id_lote).with_for_update().first()
    if movimentacao.tipo_movimentacao == "Entrada":
        nova_quantidade = lote.quantidade - movimentacao.quantidade
    else:
        nova_quantidade = lote.quantidade + movimentacao.quantidade

    if nova_quantidade < 0 or nova_quantidade > lote.capacidade:
        return jsonify({
            "erro": "Não é possível excluir: a reversão deixaria a quantidade do lote fora dos limites permitidos."
        }), 409

    try:
        lote.quantidade = nova_quantidade
        db.session.delete(movimentacao)
        db.session.commit()
        return jsonify({"message": "Movimentação excluída com sucesso."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"erro": "Ocorreu um erro ao excluir a movimentação."}), 500

# __________________________________________________________________________________________________________________


# @app.route("/api/farmacos", methods=["POST"])
# @jwt_required()
# def criar_farmaco():
#     # Verifica se o usuário é um administrador.
#     claims = get_jwt()
#     if not claims["administrador"]:
#         return jsonify({"erro": "Acesso negado!"}), 403

#     dados = request.get_json()
#     nome=dados.get("nome")
#     id_fornecedor=dados.get("fornecedor.id")
#     status=dados.get("status")

#     try:
#         # Verifica se o fornecedor já existe no banco de dados.
#         if Fornecedor.query.filter_by(cnpj=cnpj).first():
#             return jsonify({"error": "Fornecedor já existe."}), 409

#         else:
#             novo_fornecedor = Fornecedor(
#                 nome=nome,
#                 cnpj=cnpj,
#                 telefone=telefone,
#                 email=email
#             )
#             db.session.add(novo_fornecedor)
#             db.session.commit()
#             return jsonify({"message": "Fornecedor criado com sucesso."}), 201
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Ocorreu um erro ao criar o fornecedor."}), 500
#_______________________________________________________________



# @app.route("/api/fornecedores", methods=["GET"])
# @jwt_required()
# def listar_fornecedores():
#      # Verifica se o usuário é um administrador.
#     claims = get_jwt()
#     if not claims["administrador"]:
#         return jsonify({"erro": "Acesso negado!"}), 403

#     #tenta buscar os fornecedores no banco de dados.
#     try:
#         # Busca todos os fornecedores ativos no banco de dados.
#         fornecedores = Fornecedor.query.filter_by(status=True).all()

#         resultado = [{
#             "id": fornecedor.id_fornecedor,
#             "nome": fornecedor.nome,
#             "cnpj": fornecedor.cnpj,
#             "telefone": fornecedor.telefone,
#             "email": fornecedor.email
#         } for fornecedor in fornecedores]
#         return jsonify(resultado), 200
#     except Exception as e:
#         return jsonify({"error": "Ocorreu um erro ao buscar os fornecedores."}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
