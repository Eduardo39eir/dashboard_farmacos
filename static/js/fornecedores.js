// Verifica se o usuário está logado ao carregar a página.
if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
}


// Carrega a lista de fornecedores ao abrir a página.
listar_fornecedores();


// Função para salvar um fornecedor.
async function salvar_fornecedor() {

    // Captura os dados do formulário.
    const token = localStorage.getItem("token");

    const id =
        document.getElementById("in-forn-id").value;

    const nome =
        document.getElementById("in-forn-nome").value;

    const cnpj =
        document.getElementById("in-forn-cnpj").value;

    const telefone =
        document.getElementById("in-forn-tel").value;

    const email =
        document.getElementById("in-forn-email").value;


    // Mini elemento de fallback caso a div 'mensagem' não exista no HTML
    const msgElemento =
        document.getElementById("mensagem") ||
        {
            textContent: "",
            className: ""
        };


    try {

        const url =
            id
                ? `/api/fornecedores/${id}`
                : "/api/fornecedores";


        const metodo =
            id
                ? "PUT"
                : "POST";


        // Envia os dados para o backend.
        const resposta = await fetch(
            url,
            {
                method: metodo,

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    nome,
                    telefone,
                    email,
                    cnpj
                })
            }
        );


        const dados = await resposta.json();


        // Verifica se o cadastro foi bem-sucedido.
        if (resposta.ok) {

            // Exibe a mensagem de sucesso e limpa o formulário.
            msgElemento.className =
                "alert alert-success";


            msgElemento.textContent =
                dados.message ||
                dados.mensagem ||
                "Fornecedor salvo com sucesso!";


            cancelar();

            listar_fornecedores();


            setTimeout(function () {

                msgElemento.className = "";
                msgElemento.textContent = "";

            }, 4000);


        } else {

            // Exibe a mensagem de erro retornada pelo backend.
            msgElemento.className =
                "alert alert-danger";


            msgElemento.textContent =
                dados.erro ||
                dados.error ||
                "Erro ao salvar fornecedor.";


            setTimeout(function () {

                msgElemento.className = "";
                msgElemento.textContent = "";

            }, 4000);

        }


    } catch (erro) {

        console.error(
            "Erro na requisição:",
            erro
        );


        // Exibe a mensagem de erro caso o backend não esteja disponível.
        msgElemento.className =
            "alert alert-warning";


        msgElemento.textContent =
            "Não foi possível atender sua requisição no momento. Tente mais tarde...";


        setTimeout(function () {

            msgElemento.className = "";
            msgElemento.textContent = "";

        }, 4000);

    }
}


// Função para preparar o modal do fornecedor.
function prepararModalFornecedor(fornecedor = null) {

    document.getElementById("in-forn-id").value =
        fornecedor
            ? fornecedor.id
            : "";


    document.getElementById("in-forn-nome").value =
        fornecedor
            ? fornecedor.nome
            : "";


    document.getElementById("in-forn-cnpj").value =
        fornecedor
            ? fornecedor.cnpj
            : "";


    document.getElementById("in-forn-tel").value =
        fornecedor
            ? fornecedor.telefone || ""
            : "";


    document.getElementById("in-forn-email").value =
        fornecedor
            ? fornecedor.email
            : "";


    const titulo =
        document.getElementById(
            "titulo-modal-fornecedor"
        );


    const botao =
        document.getElementById(
            "btn-save-forn"
        );


    if (titulo) {

        titulo.textContent =
            fornecedor
                ? "Editar Fornecedor"
                : "Novo Fornecedor";

    }


    if (botao) {

        botao.textContent =
            fornecedor
                ? "Salvar Alterações"
                : "Salvar Fornecedor";

    }

}


// Função para listar todos os fornecedores na tabela.
async function listar_fornecedores() {

    try {

        // Envia a requisição para o backend.
        const resposta = await fetch(
            "/api/fornecedores",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${localStorage.getItem("token")}`
                }
            }
        );


        const dados =
            await resposta.json();


        // Captura o corpo da tabela.
        const tabela =
            document.getElementById(
                "tabela-fornecedores"
            );


        if (!tabela) {

            console.error(
                "Erro: O elemento tbody com id 'tabela-fornecedores' não foi encontrado no HTML."
            );

            return;

        }


        tabela.innerHTML = "";


        // Preenche a tabela com os fornecedores retornados pelo backend.
        dados.forEach(function (fornecedor) {

            tabela.innerHTML += `
                <tr>

                    <td>
                        ${fornecedor.id}
                    </td>

                    <td>
                        ${escaparHTML(fornecedor.nome)}
                    </td>

                    <td>
                        ${escaparHTML(fornecedor.cnpj)}
                    </td>

                    <td>
                        ${escaparHTML(fornecedor.telefone || "—")}
                    </td>

                    <td>
                        ${escaparHTML(fornecedor.email)}
                    </td>

                    <td>

                        <button
                            class="btn btn-outline"
                            onclick="editar_fornecedor(${fornecedor.id})">

                            Editar

                        </button>

                        <button
                            class="btn btn-primary"
                            onclick="excluir_fornecedor(${fornecedor.id})">

                            Excluir

                        </button>

                    </td>

                </tr>
            `;

        });


    } catch (erro) {

        console.error(
            "Não foi possível carregar os fornecedores:",
            erro
        );

    }

}


// Função para cancelar e limpar o formulário.
function cancelar() {

    document.getElementById("in-forn-id").value = "";

    document.getElementById("in-forn-nome").value = "";

    document.getElementById("in-forn-cnpj").value = "";

    document.getElementById("in-forn-tel").value = "";

    document.getElementById("in-forn-email").value = "";


    document.getElementById(
        "titulo-modal-fornecedor"
    ).textContent =
        "Novo Fornecedor";


    document.getElementById(
        "btn-save-forn"
    ).textContent =
        "Salvar Fornecedor";


    closeModals();

}


// Função para editar um fornecedor.
async function editar_fornecedor(id) {

    try {

        const resposta = await fetch(
            "/api/fornecedores",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${localStorage.getItem("token")}`
                }
            }
        );


        if (!resposta.ok) {

            throw new Error(
                "Falha ao buscar fornecedor."
            );

        }


        const fornecedores =
            await resposta.json();


        const fornecedor =
            fornecedores.find(
                item =>
                    Number(item.id) === Number(id)
            );


        if (!fornecedor) {

            alert(
                "Fornecedor não encontrado."
            );

            return;

        }


        prepararModalFornecedor(
            fornecedor
        );


        openModal(
            "modal-fornecedor"
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar fornecedor para edição:",
            erro
        );


        alert(
            "Não foi possível carregar os dados para edição."
        );

    }

}


// Função para abrir o modal de confirmação de exclusão do fornecedor.
function excluir_fornecedor(id, nome = "") {
    document.getElementById("excluir-forn-id").value = id;
    document.getElementById("excluir-forn-nome").textContent = nome ? `"${nome}"` : "";
    document.getElementById("excluir-forn-senha").value = "";

    const msgErro = document.getElementById("msg-erro-exclusao");
    if (msgErro) {
        msgErro.textContent = "";
        msgErro.classList.add("hidden");
    }

    openModal("modal-confirmar-exclusao-fornecedor");
}


// Função para fechar o modal de exclusão do fornecedor.
function fecharModalExclusaoFornecedor() {
    document.getElementById("excluir-forn-id").value = "";
    document.getElementById("excluir-forn-senha").value = "";
    const modal = document.getElementById("modal-confirmar-exclusao-fornecedor");
    if (modal) {
        modal.classList.add("hidden");
    }
}


// Função para confirmar e enviar a solicitação de exclusão com senha.
async function confirmarExclusaoFornecedor() {
    const id = document.getElementById("excluir-forn-id").value;
    const senha = document.getElementById("excluir-forn-senha").value.trim();
    const msgErro = document.getElementById("msg-erro-exclusao");

    if (!senha) {
        if (msgErro) {
            msgErro.textContent = "Por favor, digite sua senha para confirmar a exclusão.";
            msgErro.classList.remove("hidden");
        }
        return;
    }

    try {
        const resposta = await fetch(
            `/api/fornecedores/${id}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ senha: senha })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            if (msgErro) {
                msgErro.textContent = dados.erro || dados.message || "Erro ao excluir fornecedor.";
                msgErro.classList.remove("hidden");
            } else {
                alert(dados.erro || "Erro ao excluir fornecedor.");
            }
            return;
        }

        fecharModalExclusaoFornecedor();

        const msgElemento = document.getElementById("mensagem");
        if (msgElemento) {
            msgElemento.className = "alert alert-success";
            msgElemento.textContent = dados.message || "Fornecedor excluído com sucesso!";
            setTimeout(function () {
                msgElemento.className = "";
                msgElemento.textContent = "";
            }, 4000);
        } else {
            alert(dados.message || "Fornecedor excluído com sucesso!");
        }

        listar_fornecedores();

    } catch (erro) {
        console.error("Erro ao excluir fornecedor:", erro);
        if (msgErro) {
            msgErro.textContent = "Não foi possível excluir o fornecedor. Tente novamente.";
            msgErro.classList.remove("hidden");
        }
    }
}