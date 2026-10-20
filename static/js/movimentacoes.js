// Verifica se o usuário está logado ao carregar a página.
if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
}


// Carrega os lotes ao abrir a página.
listar_lotes();


// Carrega as movimentações ao abrir a página.
listar_movimentacoes();


// Função para exibir mensagens na tela.
function mostrarMensagem(texto, tipo) {

    const mensagem =
        document.getElementById("mensagem");


    if (!mensagem) {
        return;
    }


    if (tipo === "success") {

        mensagem.className =
            "alert alert-success";

    } else if (tipo === "warning") {

        mensagem.className =
            "alert alert-warning";

    } else {

        mensagem.className =
            "alert alert-danger";

    }


    mensagem.textContent = texto;


    setTimeout(function () {

        mensagem.className = "";
        mensagem.textContent = "";

    }, 4000);

}


// Função para carregar os lotes no select.
async function listar_lotes() {

    const token =
        localStorage.getItem("token");


    const select =
        document.getElementById(
            "sel-mov-lote"
        );


    if (!select) {

        console.error(
            "Erro: O select sel-mov-lote não foi encontrado."
        );

        return;

    }


    try {

        const resposta = await fetch(
            "/api/lotes",
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
                "Erro ao carregar os lotes."
            );

        }


        select.innerHTML = `
            <option value="">
                Selecione um lote...
            </option>
        `;


        dados.filter(function (lote) {
            return lote.status;
        }).forEach(function (lote) {

            /*
                O usuário vê o nome do fármaco
                e o número do lote.

                O value continua sendo o ID
                porque é ele que será enviado
                para o backend.
            */

            select.innerHTML += `
                <option value="${lote.id}">
                    ${escaparHTML(lote.farmaco)} - Lote ${escaparHTML(lote.numero_lote)}
                </option>
            `;

        });


    } catch (erro) {

        console.error(
            "Não foi possível carregar os lotes:",
            erro
        );

    }

}


// Função para listar todas as movimentações.
async function listar_movimentacoes() {

    const token =
        localStorage.getItem("token");


    const tabela =
        document.getElementById(
            "tabela-movimentacoes"
        );


    if (!tabela) {

        console.error(
            "Erro: tabela-movimentacoes não encontrada."
        );

        return;

    }


    try {

        const resposta = await fetch(
            "/api/movimentacoes",
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
                "Erro ao carregar movimentações."
            );

        }


        tabela.innerHTML = "";


        if (dados.length === 0) {

            tabela.innerHTML = `
                <tr>

                    <td
                        colspan="9"
                        style="text-align:center;">

                        Nenhuma movimentação registrada.

                    </td>

                </tr>
            `;

            return;

        }


        dados.forEach(function (movimentacao) {

            let dataFormatada = "—";


            if (movimentacao.data_movimentacao) {

                const data =
                    new Date(
                        movimentacao.data_movimentacao
                    );


                if (!isNaN(data.getTime())) {

                    dataFormatada =
                        data.toLocaleString(
                            "pt-BR"
                        );

                }

            }


            tabela.innerHTML += `
                <tr>

                    <td>
                        ${movimentacao.id}
                    </td>

                    <td>
                        ${escaparHTML(movimentacao.farmaco || "—")}
                    </td>

                    <td>
                        ${escaparHTML(movimentacao.numero_lote || "—")}
                    </td>

                    <td>
                        ${escaparHTML(movimentacao.tipo_movimentacao)}
                    </td>

                    <td>
                        ${movimentacao.quantidade}
                    </td>

                    <td>
                        ${escaparHTML(movimentacao.nome_usuario || "—")}
                    </td>

                    <td>
                        ${dataFormatada}
                    </td>

                    <td>
                        ${escaparHTML(movimentacao.observacao || "—")}
                    </td>

                    <td>

                        <button
                            class="btn btn-outline"
                            onclick="editar_movimentacao(${movimentacao.id})">

                            Editar

                        </button>

                        <button
                            class="btn btn-primary"
                            onclick="excluir_movimentacao(${movimentacao.id})">

                            Excluir

                        </button>

                    </td>

                </tr>
            `;

        });


    } catch (erro) {

        console.error(
            "Não foi possível carregar as movimentações:",
            erro
        );


        mostrarMensagem(
            erro.message ||
            "Não foi possível carregar as movimentações.",
            "warning"
        );

    }

}


// Função para salvar uma nova movimentação
// ou atualizar uma movimentação existente.
async function salvar_movimentacao() {

    const token =
        localStorage.getItem("token");


    const id =
        document.getElementById(
            "in-mov-id"
        ).value;


    const id_lote =
        document.getElementById(
            "sel-mov-lote"
        ).value;


    const tipo_movimentacao =
        document.getElementById(
            "sel-mov-tipo"
        ).value;


    const quantidade =
        document.getElementById(
            "in-mov-quantidade"
        ).value;


    const observacao =
        document.getElementById(
            "in-mov-observacao"
        ).value.trim();


    // Verifica se os campos obrigatórios
    // foram preenchidos.
    if (
        !id_lote ||
        !tipo_movimentacao ||
        quantidade === ""
    ) {

        mostrarMensagem(
            "Preencha o lote, o tipo e a quantidade.",
            "danger"
        );

        return;

    }


    if (Number(quantidade) <= 0) {

        mostrarMensagem(
            "A quantidade deve ser maior que zero.",
            "danger"
        );

        return;

    }


    try {

        /*
            Se existe um ID, estamos editando
            e usamos PUT.

            Caso contrário, estamos criando
            e usamos POST.
        */

        const url =
            id
                ? `/api/movimentacoes/${id}`
                : "/api/movimentacoes";


        const metodo =
            id
                ? "PUT"
                : "POST";


        const resposta = await fetch(
            url,
            {
                method: metodo,

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`

                },


                body: JSON.stringify({

                    id_lote:
                        Number(id_lote),

                    tipo_movimentacao:
                        tipo_movimentacao,

                    quantidade:
                        Number(quantidade),

                    observacao:
                        observacao

                })

            }
        );


        const dados =
            await resposta.json();


        if (resposta.ok) {

            mostrarMensagem(
                dados.message ||
                (
                    id
                        ? "Movimentação atualizada com sucesso."
                        : "Movimentação registrada com sucesso."
                ),
                "success"
            );


            cancelarMovimentacao();


            // Atualiza a tabela.
            await listar_movimentacoes();


            // Atualiza os lotes porque uma
            // movimentação altera o estoque.
            await listar_lotes();


        } else {

            mostrarMensagem(
                dados.erro ||
                dados.error ||
                "Erro ao salvar movimentação.",
                "danger"
            );

        }


    } catch (erro) {

        console.error(
            "Erro ao salvar movimentação:",
            erro
        );


        mostrarMensagem(
            "Não foi possível atender sua requisição no momento. Tente mais tarde.",
            "warning"
        );

    }

}


// Prepara o modal para cadastrar
// uma nova movimentação.
function prepararModalMovimentacao() {

    document.getElementById(
        "in-mov-id"
    ).value = "";


    document.getElementById(
        "sel-mov-lote"
    ).value = "";


    document.getElementById(
        "sel-mov-tipo"
    ).value = "";


    document.getElementById(
        "in-mov-quantidade"
    ).value = "";


    document.getElementById(
        "in-mov-observacao"
    ).value = "";


    document.getElementById(
        "titulo-modal-movimentacao"
    ).textContent =
        "Nova Movimentação";


    document.getElementById(
        "btn-save-mov"
    ).textContent =
        "Salvar Movimentação";

}


// Função para editar uma movimentação.
async function editar_movimentacao(id) {

    const token =
        localStorage.getItem("token");


    try {

        const resposta = await fetch(
            "/api/movimentacoes",
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
                "Erro ao buscar movimentação."
            );

        }


        const movimentacao =
            dados.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!movimentacao) {

            mostrarMensagem(
                "Movimentação não encontrada.",
                "danger"
            );

            return;

        }


        /*
            Coloca os dados atuais da
            movimentação dentro do modal.
        */

        document.getElementById(
            "in-mov-id"
        ).value =
            movimentacao.id;


        document.getElementById(
            "sel-mov-lote"
        ).value =
            movimentacao.id_lote;


        const tipo =
            movimentacao
                .tipo_movimentacao
                .toLowerCase()
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );


        document.getElementById(
            "sel-mov-tipo"
        ).value =
            tipo;


        document.getElementById(
            "in-mov-quantidade"
        ).value =
            movimentacao.quantidade;


        document.getElementById(
            "in-mov-observacao"
        ).value =
            movimentacao.observacao || "";


        document.getElementById(
            "titulo-modal-movimentacao"
        ).textContent =
            "Editar Movimentação";


        document.getElementById(
            "btn-save-mov"
        ).textContent =
            "Salvar Alterações";


        openModal(
            "modal-movimentacao"
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar movimentação:",
            erro
        );


        mostrarMensagem(
            "Não foi possível carregar a movimentação para edição.",
            "danger"
        );

    }

}


// Função para excluir uma movimentação.
//
// IMPORTANTE:
// O botão se chama "Excluir" na interface,
// porém o backend deve realizar exclusão
// lógica, deixando status = false.
async function excluir_movimentacao(id) {

    if (
        !confirm(
            "Deseja realmente excluir esta movimentação?"
        )
    ) {

        return;

    }


    const token =
        localStorage.getItem("token");


    try {

        const resposta = await fetch(
            `/api/movimentacoes/${id}`,
            {
                method: "DELETE",

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
                "Erro ao excluir movimentação."
            );

        }


        mostrarMensagem(
            dados.message ||
            "Movimentação excluída com sucesso.",
            "success"
        );


        // Atualiza o histórico.
        await listar_movimentacoes();


        // Atualiza os lotes porque a exclusão
        // da movimentação pode alterar o estoque.
        await listar_lotes();


    } catch (erro) {

        console.error(
            "Erro ao excluir movimentação:",
            erro
        );


        mostrarMensagem(
            erro.message ||
            "Não foi possível excluir a movimentação.",
            "danger"
        );

    }

}


// Função para cancelar e limpar o formulário.
function cancelarMovimentacao() {

    document.getElementById(
        "in-mov-id"
    ).value = "";


    document.getElementById(
        "sel-mov-lote"
    ).value = "";


    document.getElementById(
        "sel-mov-tipo"
    ).value = "";


    document.getElementById(
        "in-mov-quantidade"
    ).value = "";


    document.getElementById(
        "in-mov-observacao"
    ).value = "";


    document.getElementById(
        "titulo-modal-movimentacao"
    ).textContent =
        "Nova Movimentação";


    document.getElementById(
        "btn-save-mov"
    ).textContent =
        "Salvar Movimentação";


    closeModals();

}
