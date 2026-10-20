"""Teste de navegação real. Executar com Chromium disponível no sistema."""
import shutil
from threading import Thread
import pytest
from playwright.sync_api import sync_playwright
from werkzeug.serving import make_server
from test_fluxos import cadastrar_estoque, movimento


def test_dashboard_no_navegador(client, headers):
    chromium=shutil.which('chromium')
    if not chromium:
        pytest.skip('Instale Chromium para executar o teste de navegador.')
    lote=cadastrar_estoque(client,headers,validade=5)
    movimento(client,headers,lote,'Entrada',10)
    from app import app
    servidor=make_server('127.0.0.1',0,app,threaded=True)
    thread=Thread(target=servidor.serve_forever,daemon=True);thread.start()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox'])
            page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
            erros=[]
            page.on('pageerror',lambda erro: erros.append(str(erro)))
            base=f'http://127.0.0.1:{servidor.server_port}'
            page.goto(base)
            page.locator('#email').fill('admin@example.test')
            page.locator('#senha').fill('senha-forte-teste')
            page.locator('#login-btn').click()
            page.wait_for_url('**/dashboard.html')
            page.wait_for_function("document.getElementById('unidades').textContent === '30'")
            assert page.locator('#grafico-fluxo svg').count()==1
            assert page.locator('#alerta-contagem').inner_text()=='1'
            page.locator('#periodo').select_option('7')
            page.wait_for_function("document.getElementById('atualizado').textContent.includes('7 dias')")
            page.locator('summary').click()
            assert page.locator('#dados-fluxo tr').count()==7
            with page.expect_download() as download:
                page.locator('#exportar').click()
            assert '7-dias.csv' in download.value.suggested_filename
            assert 'Entradas (unidades)' in open(download.value.path(),encoding='utf-8-sig').read()
            page.screenshot(path='/tmp/dashboard-farmacos-desktop.png',full_page=True)
            # Dados do banco são exibidos como texto, inclusive caracteres HTML.
            page.goto(base+'/fornecedores.html')
            page.wait_for_selector('td:text("Fornecedor <teste>")')
            assert page.locator('td teste').count()==0
            for pagina in ['farmacos','estoque','movimentacoes']:
                page.goto(base+'/'+pagina+'.html')
                page.wait_for_timeout(200)
                assert page.locator('#mensagem.alert-danger').count()==0
            page.goto(base+'/dashboard.html')
            page.wait_for_function("document.getElementById('unidades').textContent === '30'")
            page.set_viewport_size({'width':390,'height':844})
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
            page.locator('#menuToggle').click()
            assert 'open' in page.locator('header').get_attribute('class')
            page.screenshot(path='/tmp/dashboard-farmacos-mobile.png',full_page=True)
            page.get_by_role('button',name='Sair',exact=True).click()
            page.wait_for_url('**/index.html')
            assert page.evaluate("localStorage.getItem('token')") is None
            assert erros==[]
            browser.close()
    finally:
        servidor.shutdown();thread.join(timeout=5)
