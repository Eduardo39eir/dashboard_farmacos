"""Integração do novo frontend com as rotas originais, usando SQLite isolado em testes.
Não configura nem acessa o MySQL do usuário e não modifica o app.py.
"""
import importlib.util
import os
from pathlib import Path
import shutil
import sys
from threading import Thread
import pytest
from playwright.sync_api import sync_playwright, expect
from werkzeug.serving import make_server
from flask_sqlalchemy import SQLAlchemy

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT))

@pytest.fixture(scope='module')
def backend():
    anterior=SQLAlchemy.init_app
    def iniciar_testes(self,app):
        app.config['SQLALCHEMY_DATABASE_URI']='sqlite://'
        app.config['JWT_SECRET_KEY']='chave-isolada-exclusiva-de-testes-do-painel'
        return anterior(self,app)
    SQLAlchemy.init_app=iniciar_testes
    try:
        spec=importlib.util.spec_from_file_location('backend_original_testes',ROOT/'app.py')
        modulo=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(modulo)
    finally:
        SQLAlchemy.init_app=anterior
    from run import registrar_painel
    registrar_painel(modulo.app)
    servidor=make_server('127.0.0.1',5001,modulo.app,threaded=True)
    thread=Thread(target=servidor.serve_forever,daemon=True);thread.start()
    yield modulo
    servidor.shutdown();thread.join(timeout=5)

@pytest.fixture()
def navegador(backend):
    chromium=shutil.which('chromium')
    if not chromium:pytest.skip('Chromium necessário para teste do frontend.')
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':1100},reduced_motion='reduce')
        page.set_default_timeout(10000)
        erros=[];page.on('pageerror',lambda erro:erros.append(str(erro)))
        yield page
        assert not erros
        browser.close()


def entrar(page):
    page.goto('http://127.0.0.1:3000/static/painel/')
    page.get_by_label('E-mail',exact=True).fill('admin@unesp.com')
    page.get_by_label('Senha',exact=True).fill('admin')
    page.get_by_role('button',name='Entrar no painel').click()
    expect(page.get_by_role('heading',name='Olá, equipe UNESP!')).to_be_visible()


def test_cadastros_movimentacao_e_dashboard(navegador):
    page=navegador
    entrar(page)
    expect(page.get_by_text('Nenhum alerta',exact=True)).to_be_visible()
    page.get_by_role('button',name='Fornecedores',exact=True).click()
    page.get_by_role('button',name='Novo fornecedor',exact=True).click()
    dialog=page.get_by_role('dialog')
    dialog.get_by_label('Nome',exact=True).fill('Fornecedor teste')
    dialog.get_by_label('CNPJ',exact=True).fill('12345678000199')
    dialog.get_by_label('Telefone',exact=True).fill('11999990000')
    dialog.get_by_label('E-mail',exact=True).fill('fornecedor@example.test')
    dialog.get_by_role('button',name='Salvar registro').click()
    expect(dialog).not_to_be_visible()
    expect(page.get_by_role('cell',name='Fornecedor teste',exact=True)).to_be_visible()
    page.get_by_role('button',name='Fármacos',exact=True).click()
    page.get_by_role('button',name='Novo fármaco',exact=True).click()
    dialog.get_by_label('Nome do fármaco').fill('Fármaco teste')
    dialog.get_by_label('Fornecedor',exact=True).select_option(label='Fornecedor teste')
    dialog.get_by_role('button',name='Salvar registro').click()
    expect(dialog).not_to_be_visible()
    page.get_by_role('button',name='Estoque',exact=True).click()
    page.get_by_role('button',name='Novo lote',exact=True).click()
    dialog.get_by_label('Fármaco',exact=True).select_option(label='Fármaco teste')
    dialog.get_by_label('Número do lote').fill('SIG-001')
    from datetime import date,timedelta
    dialog.get_by_label('Data de fabricação').fill(date.today().isoformat())
    dialog.get_by_label('Data de validade').fill((date.today()+timedelta(days=5)).isoformat())
    dialog.get_by_label('Quantidade',exact=True).fill('20')
    dialog.get_by_label('Capacidade',exact=True).fill('100')
    dialog.get_by_role('button',name='Salvar registro').click()
    expect(dialog).not_to_be_visible()
    page.get_by_role('navigation').get_by_role('button',name='Movimentações',exact=True).click()
    page.get_by_role('button',name='Nova movimentação',exact=True).click()
    dialog.get_by_label('Lote',exact=True).select_option(index=1)
    dialog.get_by_label('Operação',exact=True).select_option('Entrada')
    dialog.get_by_label('Quantidade',exact=True).fill('10')
    dialog.get_by_label('Observação (opcional)',exact=True).fill('Entrada de teste')
    dialog.get_by_role('button',name='Salvar registro').click()
    expect(dialog).not_to_be_visible()
    expect(page.get_by_role('cell',name='Entrada de teste',exact=True)).to_be_visible()
    page.get_by_role('button',name='Dashboard',exact=True).click()
    expect(page.get_by_text('30 unidades',exact=True).first).to_be_visible()
    page.get_by_role('combobox',name='Período',exact=True).select_option('7')
    with page.expect_download() as download:
        page.get_by_role('button',name='Baixar dados',exact=True).click()
    assert download.value.suggested_filename=='fluxo-7-dias.csv'
    assert len(Path(download.value.path()).read_text(encoding='utf-8-sig').splitlines()) == 8
    expect(page.get_by_role('heading',name='Fluxo do estoque')).to_be_visible()
    expect(page.get_by_role('heading',name='Próximas validades')).to_be_visible()
    expect(page.get_by_role('heading',name='Relatório de movimentações')).to_be_visible()
    expect(page.locator('.youcare-grid')).to_be_visible()
    page.wait_for_timeout(600)
    page.screenshot(path='/tmp/sigir-ventek-desktop.png',full_page=True)
    page.get_by_role('navigation').get_by_role('button',name='Movimentações',exact=True).click()
    page.get_by_role('button',name='Editar registro 1',exact=True).click()
    dialog.get_by_label('Quantidade',exact=True).fill('15')
    dialog.get_by_role('button',name='Salvar registro').click()
    expect(dialog).not_to_be_visible()
    expect(page.get_by_role('cell',name='15',exact=True)).to_be_visible()
    page.get_by_role('button',name='Excluir registro 1',exact=True).click()
    dialog.get_by_role('button',name='Confirmar exclusão',exact=True).click()
    expect(dialog).not_to_be_visible()
    expect(page.get_by_text('Nenhum registro encontrado',exact=True)).to_be_visible()
    page.get_by_role('button',name='Nova movimentação',exact=True).click()
    dialog.get_by_label('Lote',exact=True).select_option(index=1)
    dialog.get_by_label('Operação',exact=True).select_option('Saída')
    dialog.get_by_label('Quantidade',exact=True).fill('21')
    dialog.get_by_role('button',name='Salvar registro').click()
    expect(dialog.get_by_role('alert')).to_contain_text('maior que a quantidade disponível')
    dialog.get_by_role('button',name='Cancelar',exact=True).click()
    page.get_by_role('button',name='Dashboard',exact=True).click()
    expect(page.get_by_text('20 unidades',exact=True).first).to_be_visible()
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.wait_for_timeout(600)
    page.screenshot(path='/tmp/sigir-ventek-mobile.png',full_page=True)
    page.get_by_role('button',name='Menu de navegação').click()
    page.get_by_role('button',name='Estoque',exact=True).click()
    page.get_by_role('textbox',name='Buscar em Estoque e lotes').fill('inexistente')
    expect(page.get_by_text('Nenhum registro encontrado',exact=True)).to_be_visible()
    page.get_by_role('button',name='Perfil do administrador',exact=True).click()
    page.get_by_role('button',name='Sair',exact=True).click()
    expect(page.get_by_role('heading',name='Bem-vindo de volta.')).to_be_visible()
    # O endereço exato da tela antiga agora serve o build atual junto da API.
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto('http://127.0.0.1:5001/templates/html/dashboard.html')
    page.get_by_label('E-mail',exact=True).fill('admin@unesp.com')
    page.get_by_label('Senha',exact=True).fill('admin')
    page.get_by_role('button',name='Entrar no painel').click()
    expect(page.get_by_role('heading',name='Olá, equipe UNESP!')).to_be_visible()
    expect(page.locator('.youcare-header')).to_be_visible()
    assert page.locator('.dashboard-layout').count()==0
    page.wait_for_timeout(700)
    page.mouse.move(8,8)
    page.screenshot(path='/tmp/sigir-youcare-integrado.png',full_page=True)



def test_enderecos_antigos_servem_painel_atual(backend):
    client=backend.app.test_client()
    for caminho in ['/', '/index.html','/dashboard.html','/templates/html/dashboard.html','/templates/html/estoque.html']:
        resposta=client.get(caminho)
        assert resposta.status_code==200
        html=resposta.get_data(as_text=True)
        assert '/static/painel/assets/' in html
        assert 'dashboard-layout' not in html
        assert '/static/js/dashboard.js' not in html
        import re
        script=re.search(r'src="([^"]+\.js)"',html).group(1)
        assert client.get(script).status_code==200
    assert client.get('/inexistente.html').status_code==404
