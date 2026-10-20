from datetime import date, timedelta
import pytest
from app import app, db, Lote
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql


def cadastrar_estoque(client, headers, validade=30, quantidade=20):
    assert client.post('/api/fornecedores', headers=headers, json={
        'nome':'Fornecedor <teste>', 'cnpj':'12345678000199','telefone':'11999990000','email':'fornecedor@example.test'}).status_code == 201
    resposta = client.post('/api/farmacos', headers=headers, json={'nome':'Fármaco A','id_fornecedor':1})
    assert resposta.status_code == 201
    resposta = client.post('/api/lotes', headers=headers, json={
        'id_farmaco':resposta.json['id'], 'numero_lote':'L-001', 'quantidade':quantidade, 'capacidade':100,
        'data_fabricacao':(date.today()-timedelta(days=20)).isoformat(),
        'data_validade':(date.today()+timedelta(days=validade)).isoformat()})
    assert resposta.status_code == 201
    return resposta.json['id']


def movimento(client, headers, lote, tipo, quantidade):
    return client.post('/api/movimentacoes', headers=headers, json={
        'id_lote':lote,'tipo_movimentacao':tipo,'quantidade':quantidade})


def test_login_permissoes_e_paginas(client):
    assert client.get('/api/dashboard').status_code == 401
    assert client.post('/api/login', json={'email':'admin@example.test','senha':'errada'}).status_code == 401
    assert client.post('/api/login', json={}).status_code == 400
    resposta = client.post('/api/login', json={'email':'leitor@example.test','senha':'senha-forte-teste'})
    assert client.get('/api/dashboard',headers={'Authorization':'Bearer '+resposta.json['token']}).status_code == 403
    for pagina in ['/', '/dashboard.html', '/templates/html/estoque.html', '/farmacos.html', '/fornecedores.html', '/movimentacoes.html']:
        assert client.get(pagina).status_code == 200
    assert client.get('/inexistente.html').status_code == 404
    assert client.get('/health').json == {'status':'ok'}


def test_movimentacao_edicao_e_reversao(client, headers):
    lote = cadastrar_estoque(client,headers)
    resposta = movimento(client,headers,lote,'Entrada',10)
    assert resposta.status_code == 201
    assert resposta.json['quantidade_atual'] == 30
    id_mov = resposta.json['id']
    assert movimento(client,headers,lote,'Saída',31).status_code == 400
    assert movimento(client,headers,lote,'Entrada',80).status_code == 400
    assert client.put(f'/api/movimentacoes/{id_mov}',headers=headers,json={'quantidade':15}).status_code == 200
    assert client.get('/api/lotes',headers=headers).json[0]['quantidade'] == 35
    assert client.delete(f'/api/movimentacoes/{id_mov}',headers=headers).status_code == 200
    assert client.get('/api/lotes',headers=headers).json[0]['quantidade'] == 20
    assert len(client.get('/api/movimentacoes',headers=headers).json) == 0


def test_edicao_entre_lotes(client,headers):
    lote = cadastrar_estoque(client,headers)
    with app.app_context():
        outro=Lote(id_farmaco=1,numero_lote='L-002',quantidade=40,capacidade=100,
                   data_fabricacao=date.today(),data_validade=date.today()+timedelta(days=20))
        db.session.add(outro);db.session.commit();outro_id=outro.id
    resposta=movimento(client,headers,lote,'Saída',5)
    assert client.put(f"/api/movimentacoes/{resposta.json['id']}",headers=headers,
                      json={'id_lote':outro_id,'tipo_movimentacao':'Entrada','quantidade':10}).status_code==200
    lotes=client.get('/api/lotes',headers=headers).json
    assert [item['quantidade'] for item in lotes]==[20,50]


@pytest.mark.parametrize('dias', [7,30,90])
def test_dashboard_agregados(client,headers,dias):
    lote=cadastrar_estoque(client,headers,validade=5)
    assert movimento(client,headers,lote,'Entrada',10).status_code==201
    assert movimento(client,headers,lote,'Saída',3).status_code==201
    dados=client.get(f'/api/dashboard?dias={dias}',headers=headers).json
    assert dados['unidades_disponiveis']==27
    assert dados['entradas_periodo']==10 and dados['saidas_periodo']==3
    assert dados['evolucao'][-1]['entradas']==10
    assert len(dados['evolucao'])==dias
    assert dados['validade'][1]['quantidade']==1
    assert dados['alertas'][0]['dias']==5
    assert len(dados['recentes'])==2
    assert dados['estoque_por_farmaco']==[{'nome':'Fármaco A','quantidade':27}]


def test_vencidos_nao_disponiveis(client,headers):
    lote=cadastrar_estoque(client,headers,validade=-1)
    assert movimento(client,headers,lote,'Saída',1).status_code==409
    dados=client.get('/api/dashboard',headers=headers).json
    assert dados['unidades_disponiveis']==0
    assert dados['validade'][2]['quantidade']==1
    assert dados['alertas'][0]['dias']==-1


def test_inativacao_cascata(client,headers):
    lote=cadastrar_estoque(client,headers)
    assert client.delete('/api/fornecedores/1',headers=headers,json={'senha':'errada'}).status_code==401
    assert client.delete('/api/fornecedores/1',headers=headers,json={'senha':'senha-forte-teste'}).status_code==200
    assert client.get('/api/lotes',headers=headers).json==[]
    assert movimento(client,headers,lote,'Entrada',1).status_code==409
    assert client.get('/api/dashboard',headers=headers).json['lotes_ativos']==0


def test_vazio_validacoes_e_duplicados(client,headers):
    dados=client.get('/api/dashboard',headers=headers).json
    assert dados['lotes_ativos']==0 and dados['recentes']==[]
    for dias in ['abc','0','999']:
        assert client.get('/api/dashboard?dias='+dias,headers=headers).status_code==400
    assert client.post('/api/login',json=[]).status_code==400
    assert client.post('/api/fornecedores',headers=headers,json={}).status_code==400
    cadastrar_estoque(client,headers)
    assert client.post('/api/farmacos',headers=headers,json={'nome':'Fármaco A','id_fornecedor':1}).status_code==409
    assert client.put('/api/lotes/1',headers=headers,json={'quantidade':101}).status_code==400
    assert client.put('/api/farmacos/1',headers=headers,json={'nome':'Novo nome'}).status_code==200
    assert client.get('/api/farmacos',headers=headers).json[0]['nome']=='Novo nome'
    assert client.patch('/api/farmacos/1/status',headers=headers).status_code==200
    assert client.patch('/api/farmacos/1/status',headers=headers).status_code==200
    assert client.delete('/api/lotes/1',headers=headers).status_code==200
    assert client.patch('/api/lotes/1/status',headers=headers).status_code==200


def test_esquema_compativel_postgresql():
    for tabela in db.metadata.sorted_tables:
        ddl=str(CreateTable(tabela).compile(dialect=postgresql.dialect()))
        assert 'CREATE TABLE' in ddl


def test_comandos_inicializacao(client):
    runner=app.test_cli_runner()
    assert runner.invoke(args=['init-db']).exit_code==0
    assert runner.invoke(args=['init-db']).exit_code==0
    result=runner.invoke(args=['create-admin','--nome','Novo','--email','novo@example.test','--senha','uma-senha-longa-segura'])
    assert result.exit_code==0
    assert runner.invoke(args=['create-admin','--nome','Outro','--email','novo@example.test','--senha','uma-senha-longa-segura']).exit_code!=0
