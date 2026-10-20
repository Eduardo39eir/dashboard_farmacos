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
            assert page.locator('.donut-center strong').inner_text()=='1'
            assert '100%' in page.locator('.donut-legend').inner_text()
            page.get_by_role('radio',name='7 dias',exact=True).check()
            page.wait_for_function("document.getElementById('atualizado').textContent.includes('7 dias')")
            page.locator('summary').click()
            assert page.locator('#dados-fluxo tr').count()==7
            with page.expect_download() as download:
                page.locator('#exportar').click()
            assert '7-dias.csv' in download.value.suggested_filename
            assert 'Entradas (unidades)' in open(download.value.path(),encoding='utf-8-sig').read()
            page.locator('summary').click()
            page.evaluate('window.scrollTo(0, 0)')
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
            page.screenshot(path='/tmp/dashboard-farmacos-mobile.png',full_page=True)
            page.locator('#menuToggle').click()
            assert 'open' in page.locator('header').get_attribute('class')
            page.get_by_role('button',name='Sair',exact=True).click()
            page.wait_for_url('**/index.html')
            assert page.evaluate("localStorage.getItem('token')") is None
            assert erros==[]
            browser.close()
    finally:
        servidor.shutdown();thread.join(timeout=5)


def test_estados_do_painel_e_teclado(client, headers):
    chromium=shutil.which('chromium')
    if not chromium:
        pytest.skip('Instale Chromium para executar o teste de navegador.')
    from app import app
    servidor=make_server('127.0.0.1',0,app,threaded=True)
    thread=Thread(target=servidor.serve_forever,daemon=True);thread.start()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox'])
            page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
            base=f'http://127.0.0.1:{servidor.server_port}'
            page.goto(base)
            token=headers['Authorization'].removeprefix('Bearer ')
            page.evaluate('(token) => localStorage.setItem("token", token)',token)
            # Segura a primeira consulta para observar o estado real de carregamento.
            pendentes=[]
            page.route('**/api/dashboard?*',lambda route: pendentes.append(route))
            page.goto(base+'/dashboard.html',wait_until='domcontentloaded')
            page.wait_for_function("document.getElementById('atualizar').getAttribute('aria-busy') === 'true'")
            assert page.locator('.overview.is-loading').count()==1
            assert page.get_by_role('radio',name='30 dias',exact=True).is_disabled()
            assert page.locator('#exportar').is_disabled()
            page.wait_for_timeout(100)
            assert pendentes
            pendentes.pop().fulfill(status=500,json={'erro':'Falha temporária no banco.'})
            page.wait_for_function("document.querySelector('.overview').getAttribute('aria-busy') === 'false'")
            assert 'Falha temporária' in page.locator('#mensagem').inner_text()
            assert page.locator('.overview.is-loading').count()==0
            page.unroute('**/api/dashboard?*')
            page.locator('#atualizar').click()
            page.wait_for_function("document.getElementById('unidades').textContent === '0'")
            assert page.locator('#mensagem').inner_text()==''
            assert 'Nenhum lote para analisar' in page.locator('#grafico-validade').inner_text()
            assert 'Seu estoque começa aqui' in page.locator('#grafico-estoque').inner_text()
            assert 'Validades sob controle' in page.locator('#alertas').inner_text()
            assert 'Nenhuma movimentação' in page.locator('#recentes').inner_text()
            # As opções nativas de rádio suportam navegação por setas.
            page.get_by_role('radio',name='30 dias',exact=True).focus()
            page.keyboard.press('ArrowRight')
            page.wait_for_function("document.getElementById('atualizado').textContent.includes('90 dias')")
            assert page.get_by_role('radio',name='90 dias',exact=True).is_checked()
            assert page.get_by_role('radio',name='90 dias',exact=True).evaluate('(el) => el === document.activeElement')
            page.keyboard.press('ArrowLeft')
            page.wait_for_function("document.getElementById('atualizado').textContent.includes('30 dias')")
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
            browser.close()
    finally:
        servidor.shutdown();thread.join(timeout=5)
