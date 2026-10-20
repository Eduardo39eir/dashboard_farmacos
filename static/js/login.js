const mensagem = document.getElementById('mensagem');
mensagem.textContent = new URLSearchParams(window.location.search).get('msg') || '';
document.getElementById('login-form').addEventListener('submit', login_user);

async function login_user(event) {
    event.preventDefault();
    const botao = document.getElementById('login-btn');
    botao.disabled = true;
    mensagem.textContent = 'Autenticando…';
    try {
        const resposta = await fetch('/api/login', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: document.getElementById('email').value.trim(),
                                  senha: document.getElementById('senha').value})
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.error || dados.erro || 'Não foi possível entrar.');
        localStorage.setItem('token', dados.token);
        window.location.href = '/dashboard.html';
    } catch (erro) {
        mensagem.textContent = erro.message === 'Failed to fetch' ? 'Não foi possível conectar ao servidor.' : erro.message;
    } finally {
        botao.disabled = false;
    }
}
