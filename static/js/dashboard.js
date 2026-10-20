// Mantém os nomes de funções e a organização por página do projeto original.
if (!localStorage.getItem('token')) window.location.href = '/index.html';
let dadosPainel = null;
const numero = valor => Number(valor).toLocaleString('pt-BR');
const dataCurta = valor => new Date(valor + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'});

async function carregar_dashboard() {
    if (!document.getElementById('total-lotes')) return;
    const botao = document.getElementById('atualizar');
    const periodo = document.getElementById('periodo');
    const mensagem = document.getElementById('mensagem');
    botao.disabled = true;
    periodo.disabled = true;
    mensagem.textContent = '';
    document.querySelector('.overview').setAttribute('aria-busy', 'true');
    try {
        const resposta = await fetch(`/api/dashboard?dias=${periodo.value}`, {
            headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível carregar o painel.');
        dadosPainel = dados;
        for (const [id, valor] of Object.entries({'total-lotes':dados.lotes_ativos,
            'total-farmacos':dados.farmacos, 'total-movimentacoes':dados.movimentacoes,
            'unidades':dados.unidades_disponiveis})) document.getElementById(id).textContent = numero(valor);
        document.getElementById('fornecedores').textContent = `${numero(dados.fornecedores)} fornecedores ativos`;
        document.getElementById('resumo-periodo').textContent = `${numero(dados.entradas_periodo)} entradas · ${numero(dados.saidas_periodo)} saídas (unidades no período)`;
        document.getElementById('atualizado').textContent = `Atualizado às ${new Date(dados.atualizado_em).toLocaleTimeString('pt-BR')} · últimos ${dados.periodo_dias} dias`;
        renderizar_fluxo(dados.evolucao);
        renderizar_barras('grafico-validade', dados.validade, ['#087f78','#d49521','#cb4c63']);
        renderizar_barras('grafico-estoque', dados.estoque_por_farmaco);
        document.getElementById('alerta-contagem').textContent = numero(dados.alertas.length);
        document.getElementById('alertas').innerHTML = dados.alertas.length ? dados.alertas.map(item => `
            <div class="alert-item"><div><strong>${escaparHTML(item.farmaco)}</strong><small>Lote ${escaparHTML(item.lote)} · ${numero(item.quantidade)} un. · ${dataCurta(item.validade)}</small></div>
            <span class="status-pill ${item.dias < 0 ? 'danger' : ''}">${item.dias < 0 ? 'Vencido' : item.dias === 0 ? 'Vence hoje' : `Em ${item.dias} dias`}</span></div>`).join('') : '<p class="empty-state">Nenhum lote com saldo exige atenção à validade.</p>';
        document.getElementById('recentes').innerHTML = dados.recentes.length ? dados.recentes.map(item => `
            <tr><td>${escaparHTML(item.farmaco)}<br><small class="muted">Lote ${escaparHTML(item.lote)}</small></td>
            <td><span class="status-pill ${item.tipo === 'Entrada' ? 'success' : 'info'}">${escaparHTML(item.tipo)}</span></td>
            <td>${numero(item.quantidade)}</td><td>${escaparHTML(item.usuario)}</td><td>${new Date(item.data).toLocaleString('pt-BR')}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">Nenhuma movimentação neste período.</td></tr>';
        document.getElementById('exportar').disabled = false;
    } catch (erro) {
        mensagem.className = 'alert alert-danger';
        mensagem.textContent = `${erro.message} Use Atualizar para tentar novamente.`;
        document.getElementById('atualizado').textContent = dadosPainel ? 'Falha na atualização. Os dados exibidos são da última consulta concluída.' : 'Dados indisponíveis.';
    } finally {
        botao.disabled = false;
        periodo.disabled = false;
        document.querySelector('.overview').setAttribute('aria-busy', 'false');
    }
}

function renderizar_barras(id, itens, cores = ['#087f78']) {
    const maximo = Math.max(...itens.map(item => item.quantidade), 1);
    document.getElementById(id).innerHTML = itens.length && itens.some(item => item.quantidade) ? itens.map((item, indice) => `
        <div class="bar-row"><div class="bar-label"><span title="${escaparHTML(item.nome)}">${escaparHTML(item.nome)}</span><strong>${numero(item.quantidade)}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="width:${item.quantidade / maximo * 100}%;background:${cores[indice % cores.length]}"></div></div></div>`).join('') : '<p class="empty-state">Sem dados de estoque para exibir.</p>';
}

function renderizar_fluxo(serie) {
    const maximo = Math.max(...serie.flatMap(item => [item.entradas, item.saidas]), 1);
    const x = indice => 40 + indice / Math.max(serie.length - 1, 1) * 540;
    const y = quantidade => 180 - quantidade / maximo * 150;
    const linhas = ['entradas', 'saidas'].map((chave, indice) => `<polyline fill="none" stroke="${indice ? '#3675dc' : '#087f78'}" stroke-width="2.5" stroke-linejoin="round" points="${serie.map((item, i) => `${x(i)},${y(item[chave])}`).join(' ')}"/>`).join('');
    const rotulos = [0, Math.floor((serie.length - 1)/2), serie.length - 1];
    document.getElementById('grafico-fluxo').innerHTML = `<svg viewBox="0 0 600 215" role="img" aria-label="Entradas e saídas diárias. Os valores exatos estão na tabela abaixo.">
        ${[0,.5,1].map(fracao => `<line x1="40" x2="580" y1="${y(maximo * fracao)}" y2="${y(maximo * fracao)}" stroke="#e3eaf2"/><text x="30" y="${y(maximo * fracao)+4}" text-anchor="end">${numero(Math.round(maximo * fracao))}</text>`).join('')}
        ${linhas}${rotulos.map(i => `<text x="${x(i)}" y="207" text-anchor="middle">${dataCurta(serie[i].data)}</text>`).join('')}</svg>`;
    document.getElementById('dados-fluxo').innerHTML = serie.map(item => `<tr><td>${dataCurta(item.data)}</td><td>${numero(item.entradas)}</td><td>${numero(item.saidas)}</td></tr>`).join('');
}

function exportar_csv() {
    if (!dadosPainel) return;
    // Exporta toda a série exibida, com proteção contra fórmulas em planilhas.
    const celula = valor => '"' + String(valor).replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"';
    const linhas = [['Data','Entradas (unidades)','Saídas (unidades)'], ...dadosPainel.evolucao.map(item => [item.data,item.entradas,item.saidas])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + linhas.map(linha => linha.map(celula).join(';')).join('\r\n')], {type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = `movimentacoes-${dadosPainel.periodo_dias}-dias.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function fazer_logout() {
    try { await fetch('/api/logout', {method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${localStorage.getItem('token')}`}, body:'{}'}); }
    finally { localStorage.removeItem('token'); window.location.href = '/index.html'; }
}

if (document.getElementById('total-lotes')) {
    document.getElementById('periodo').addEventListener('change', carregar_dashboard);
    document.getElementById('atualizar').addEventListener('click', carregar_dashboard);
    document.getElementById('exportar').addEventListener('click', exportar_csv);
    carregar_dashboard();
}
