// Verifica se o usuário está logado ao carregar a página.
if (!localStorage.getItem("token")) {

    window.location.href = "index.html";

}


// Carrega os fornecedores ao abrir a página.
listar_fornecedores();


// Carrega os fármacos ao abrir a página.
listar_farmacos();


// Função para carregar os fornecedores no select.
async function listar_fornecedores() {

    const token =
        localStorage.getItem("token");


    const select =
        document.getElementById(
            "sel-farm-forn"
        );


    if (!select) {

        console.error(
            "Erro: O elemento select com id 'sel-farm-forn' não foi encontrado."
        );

        return;

    }


    try {

        // Envia a requisição para buscar os fornecedores.
        const resposta = await fetch(
            "/api/fornecedores",
            {
                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`

                }
            }
        );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(

                dados.erro ||
                dados.error ||
                "Erro ao buscar fornecedores."

            );

        }


        // Limpa o select.
        select.innerHTML = `
            <option value="">
                Selecione o fornecedor...
            </option>
        `;


        // Adiciona os fornecedores retornados pelo backend.
        dados.forEach(
            function (fornecedor) {

                select.innerHTML += `
                    <option value="${fornecedor.id}">
                        ${escaparHTML(fornecedor.nome)}
                    </option>
                `;

            }
        );


    } catch (erro) {

        console.error(
            "Não foi possível carregar os fornecedores:",
            erro
        );

    }

}


// Função para listar todos os fármacos na tabela.
async function listar_farmacos() {

    const token =
        localStorage.getItem("token");


    const tabela =
        document.getElementById(
            "tabela-farmacos"
        );


    if (!tabela) {

        console.error(
            "Erro: O elemento tbody com id 'tabela-farmacos' não foi encontrado no HTML."
        );

        return;

    }


    try {

        // Envia a requisição para o backend.
        const resposta = await fetch(
            "/api/farmacos",
            {
                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`

                }
            }
        );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(

                dados.erro ||
                dados.error ||
                "Erro ao carregar os fármacos."

            );

        }


        tabela.innerHTML = "";

        // Caso não existam fármacos cadastrados.
        if (dados.length === 0) {

            tabela.innerHTML = `
                <tr>

                    <td
                        colspan="6"
                        style="text-align:center;">

                        Nenhum fármaco cadastrado.

                    </td>

                </tr>
            `;

            return;

        }


        // Preenche a tabela com os fármacos retornados pelo backend.
        dados.forEach(
            function (farmaco) {


                const status =
                    farmaco.status
                        ? "Ativo"
                        : "Inativo";
                const acao = farmaco.status
                    ? `
                        <button class="btn btn-outline" onclick="editar_farmaco(${farmaco.id})">Editar</button>
                        <button class="btn btn-primary" onclick="excluir_farmaco(${farmaco.id})">Excluir</button>
                    `
                    : `<button class="btn btn-primary" onclick="alterar_status_farmaco(${farmaco.id})">Ativar</button>`;


                tabela.innerHTML += `
                    <tr>

                        <td>
                            ${farmaco.id}
                        </td>

                        <td>
                            ${escaparHTML(farmaco.nome)}
                        </td>

                        <td>
                            ${farmaco.id_fornecedor}
                        </td>

                        <td>
                            ${escaparHTML(farmaco.fornecedor || "—")}
                        </td>

                        <td>
                            ${status}
                        </td>

                        <td>
                            ${acao}
                        </td>

                    </tr>
                `;

            }
        );


    } catch (erro) {

        console.error(
            "Não foi possível carregar os fármacos:",
            erro
        );

    }

}


async function editar_farmaco(id) {

    try {
        await listar_fornecedores();

        const resposta = await fetch(
            "/api/farmacos",
            {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            }
        );
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.erro || dados.error || "Erro ao carregar o fármaco.");
        }

        const farmaco = dados.find(function (item) {
            return Number(item.id) === Number(id);
        });
        if (!farmaco) {
            throw new Error("Fármaco não encontrado.");
        }

        prepararModalFarmaco();
        document.getElementById("in-farm-id").value = farmaco.id;
        document.getElementById("in-farm-nome").value = farmaco.nome;
        document.getElementById("sel-farm-forn").value = farmaco.id_fornecedor;
        document.getElementById("titulo-modal-farmaco").textContent = "Editar Fármaco";
        document.getElementById("btn-save-farm").textContent = "Salvar Alterações";
        openModal("modal-farmaco");
    } catch (erro) {
        alert(erro.message || "Não foi possível carregar o fármaco para edição.");
    }
}


async function excluir_farmaco(id) {

    if (!confirm("Deseja inativar este fármaco? Ele será ocultado da lista principal.")) {
        return;
    }

    try {
        const resposta = await fetch(
            `/api/farmacos/${id}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            }
        );
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.erro || dados.error || "Erro ao inativar o fármaco.");
        }

        alert(dados.message || "Fármaco inativado com sucesso.");
        await listar_farmacos();
    } catch (erro) {
        alert(erro.message || "Não foi possível inativar o fármaco.");
    }
}


async function alterar_status_farmaco(id) {

    try {
        const resposta = await fetch(
            `/api/farmacos/${id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            }
        );
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.erro || dados.error || "Erro ao alterar o status do fármaco.");
        }

        alert(dados.message || "Status do fármaco alterado com sucesso.");
        await listar_farmacos();
    } catch (erro) {
        alert(erro.message || "Não foi possível alterar o status do fármaco.");
    }
}


// Função para salvar um novo fármaco.
async function salvar_farmaco() {

    // Recupera o token salvo no navegador.
    const token =
        localStorage.getItem("token");


    const id =
        document.getElementById("in-farm-id").value;


    // Captura os dados do formulário.
    const nome =
        document
            .getElementById(
                "in-farm-nome"
            )
            .value
            .trim();


    // O valor selecionado aqui é o ID do fornecedor.
    const id_fornecedor =
        document
            .getElementById(
                "sel-farm-forn"
            )
            .value;


    const msgElemento =
        document.getElementById(
            "mensagem"
        ) ||
        {
            textContent: "",
            className: ""
        };


    // Verifica se os campos foram preenchidos.
    if (
        !nome ||
        !id_fornecedor
    ) {

        msgElemento.className =
            "alert alert-danger";


        msgElemento.textContent =
            "Preencha o nome do fármaco e selecione o fornecedor.";


        return;

    }


    try {

        // Envia os dados para o backend.
        const resposta = await fetch(
            id
                ? `/api/farmacos/${id}`
                : "/api/farmacos",
            {
                method: id ? "PUT" : "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`

                },


                body: JSON.stringify({

                    nome: nome,

                    // Envia o ID do fornecedor para o Python.
                    id_fornecedor:
                        Number(id_fornecedor)

                })

            }
        );


        const dados =
            await resposta.json();


        // Verifica se o cadastro foi realizado com sucesso.
        if (resposta.ok) {


            msgElemento.className =
                "alert alert-success";


            msgElemento.textContent =
                dados.message ||
                "Fármaco criado com sucesso.";


            prepararModalFarmaco();


            // Fecha o modal.
            closeModals();


            // Atualiza a tabela depois do cadastro.
            listar_farmacos();


            setTimeout(
                function () {

                    msgElemento.className = "";

                    msgElemento.textContent = "";

                },
                4000
            );


        } else {


            msgElemento.className =
                "alert alert-danger";


            msgElemento.textContent =
                dados.erro ||
                dados.error ||
                "Erro ao cadastrar fármaco.";


            setTimeout(
                function () {

                    msgElemento.className = "";

                    msgElemento.textContent = "";

                },
                4000
            );

        }


    } catch (erro) {


        console.error(
            "Erro ao cadastrar fármaco:",
            erro
        );


        msgElemento.className =
            "alert alert-warning";


        msgElemento.textContent =
            "Não foi possível atender sua requisição no momento. Tente mais tarde...";


        setTimeout(
            function () {

                msgElemento.className = "";

                msgElemento.textContent = "";

            },
            4000
        );

    }

}


// Função para preparar o modal de fármaco.
function prepararModalFarmaco() {

    document.getElementById(
        "in-farm-id"
    ).value = "";


    document.getElementById(
        "in-farm-nome"
    ).value = "";


    document.getElementById(
        "sel-farm-forn"
    ).value = "";


    const titulo =
        document.getElementById(
            "titulo-modal-farmaco"
        );


    const botao =
        document.getElementById(
            "btn-save-farm"
        );


    if (titulo) {

        titulo.textContent =
            "Novo Fármaco";

    }


    if (botao) {

        botao.textContent =
            "Salvar Fármaco";

    }

}


// Função para cancelar e limpar o formulário.
function cancelarFarmaco() {

    document.getElementById(
        "in-farm-id"
    ).value = "";


    document.getElementById(
        "in-farm-nome"
    ).value = "";


    document.getElementById(
        "sel-farm-forn"
    ).value = "";


    closeModals();

}
