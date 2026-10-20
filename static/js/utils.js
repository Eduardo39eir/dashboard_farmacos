// Escape de conteúdo vindo do banco antes de inserir nas tabelas existentes.
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[caractere]));
}

// Expiração da sessão é tratada da mesma maneira em todas as páginas.
const fetchOriginal = window.fetch.bind(window);
window.fetch = async function (...argumentos) {
    const resposta = await fetchOriginal(...argumentos);
    const endereco = String(argumentos[0]);
    if (endereco.startsWith('/api/') && !endereco.startsWith('/api/login') && resposta.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/index.html?msg=Sessão expirada. Entre novamente.';
    }
    return resposta;
};
