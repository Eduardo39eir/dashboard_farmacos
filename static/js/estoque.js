// Verifica se o usuário está logado ao carregar a página.
if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
}


// Carrega os fármacos ao abrir a página.
listar_farmacos();


// Carrega os lotes ao abrir a página.
listar_lotes();


// Função para exibir mensagens.
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


// Função para carregar os fármacos no select.
async function listar_farmacos() {

    const token =
        localStorage.getItem("token");


    const select =
        document.getElementById(
            "sel-lote-farmaco"
        );


    if (!select) {

        console.error(
            "Erro: O select sel-lote-farmaco não foi encontrado."
        );

        return;

    }


    try {

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


        select.innerHTML = `
            <option value="">
                Selecione um fármaco...
            </option>
        `;


        // Mostra somente os fármacos ativos.
        dados.filter(function (farmaco) {
            return farmaco.status;
        }).forEach(function (farmaco) {

            /*
                Na tela aparece somente o nome.

                O value guarda o ID porque é
                esse valor que será enviado
                para o backend.
            */

            select.innerHTML += `
                <option value="${farmaco.id}">
                    ${escaparHTML(farmaco.nome)}
                </option>
            `;

        });


    } catch (erro) {

        console.error(
            "Não foi possível carregar os fármacos:",
            erro
        );

    }

}


// Função para listar os lotes.
async function listar_lotes() {

    const token =
        localStorage.getItem("token");


    const tabela =
        document.getElementById(
            "tabela-lotes"
        );


    if (!tabela) {

        console.error(
            "Erro: tabela-lotes não encontrada."
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


        tabela.innerHTML = "";


        if (dados.length === 0) {

            tabela.innerHTML = `
                <tr>

                    <td
                        colspan="9"
                        style="text-align:center;">

                        Nenhum lote para exibir.

                    </td>

                </tr>
            `;

            return;

        }


        dados.forEach(function (lote) {

            const statusTexto = lote.status ? "Ativo" : "Inativo";
            const acoes = lote.status
                ? `
                    <button class="btn btn-outline" onclick="editar_lote(${lote.id})">Editar</button>
                    <button class="btn btn-primary" onclick="excluir_lote(${lote.id})">Excluir</button>
                `
                : `<button class="btn btn-primary" onclick="alterar_status_lote(${lote.id})">Ativar</button>`;

            tabela.innerHTML += `
                <tr>

                    <td>
                        ${lote.id}
                    </td>

                    <td>
                        ${escaparHTML(lote.farmaco || "—")}
                    </td>

                    <td>
                        ${escaparHTML(lote.numero_lote)}
                    </td>

                    <td>
                        ${formatarData(lote.data_fabricacao)}
                    </td>

                    <td>
                        ${formatarData(lote.data_validade)}
                    </td>

                    <td>
                        ${lote.quantidade}
                    </td>

                    <td>
                        ${lote.capacidade}
                    </td>

                    <td>
                        ${statusTexto}
                    </td>

                    <td>
                        ${acoes}
                    </td>

                </tr>
            `;

        });


    } catch (erro) {

        console.error(
            "Não foi possível carregar os lotes:",
            erro
        );


        mostrarMensagem(
            "Não foi possível carregar os lotes.",
            "warning"
        );

    }

}


// Função para salvar ou editar um lote.
async function salvar_lote() {

    const token =
        localStorage.getItem("token");


    const id =
        document.getElementById(
            "in-lote-id"
        ).value;


    const id_farmaco =
        document.getElementById(
            "sel-lote-farmaco"
        ).value;


    const numero_lote =
        document.getElementById(
            "in-lote-numero"
        ).value.trim();


    const data_fabricacao =
        document.getElementById(
            "in-lote-fabricacao"
        ).value;


    const data_validade =
        document.getElementById(
            "in-lote-validade"
        ).value;


    const quantidade =
        document.getElementById(
            "in-lote-quantidade"
        ).value;


    const capacidade =
        document.getElementById(
            "in-lote-capacidade"
        ).value;


    // Validação dos campos.
    if (
        !id_farmaco ||
        !numero_lote ||
        !data_fabricacao ||
        !data_validade ||
        quantidade === "" ||
        capacidade === ""
    ) {

        mostrarMensagem(
            "Preencha todos os campos obrigatórios.",
            "danger"
        );

        return;

    }


    if (Number(quantidade) < 0) {

        mostrarMensagem(
            "A quantidade não pode ser negativa.",
            "danger"
        );

        return;

    }


    if (Number(capacidade) <= 0) {

        mostrarMensagem(
            "A capacidade deve ser maior que zero.",
            "danger"
        );

        return;

    }


    if (
        Number(quantidade) >
        Number(capacidade)
    ) {

        mostrarMensagem(
            "A quantidade não pode ser maior que a capacidade.",
            "danger"
        );

        return;

    }


    if (
        new Date(data_validade) <
        new Date(data_fabricacao)
    ) {

        mostrarMensagem(
            "A data de validade não pode ser anterior à fabricação.",
            "danger"
        );

        return;

    }


    try {

        /*
            Se existe ID usamos PUT.
            Se não existe usamos POST.
        */

        const url =
            id
                ? `/api/lotes/${id}`
                : "/api/lotes";


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

                    id_farmaco:
                        Number(id_farmaco),

                    numero_lote:
                        numero_lote,

                    data_fabricacao:
                        data_fabricacao,

                    data_validade:
                        data_validade,

                    quantidade:
                        Number(quantidade),

                    capacidade:
                        Number(capacidade)

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
                        ? "Lote atualizado com sucesso."
                        : "Lote criado com sucesso."
                ),
                "success"
            );


            cancelarLote();


            // Atualiza a tabela.
            await listar_lotes();


        } else {

            mostrarMensagem(
                dados.erro ||
                dados.error ||
                "Erro ao salvar lote.",
                "danger"
            );

        }


    } catch (erro) {

        console.error(
            "Erro ao salvar lote:",
            erro
        );


        mostrarMensagem(
            "Não foi possível atender sua requisição no momento. Tente mais tarde.",
            "warning"
        );

    }

}


// Prepara o modal para cadastrar um novo lote.
function prepararModalLote() {

    document.getElementById(
        "in-lote-id"
    ).value = "";


    document.getElementById(
        "sel-lote-farmaco"
    ).value = "";


    document.getElementById(
        "in-lote-numero"
    ).value = "";


    document.getElementById(
        "in-lote-fabricacao"
    ).value = "";


    document.getElementById(
        "in-lote-validade"
    ).value = "";


    document.getElementById(
        "in-lote-quantidade"
    ).value = "";


    document.getElementById(
        "in-lote-capacidade"
    ).value = "";


    document.getElementById(
        "titulo-modal-lote"
    ).textContent =
        "Novo Lote";


    document.getElementById(
        "btn-save-lote"
    ).textContent =
        "Salvar Lote";

}


// Função para editar um lote.
async function editar_lote(id) {

    const token =
        localStorage.getItem("token");


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
                "Erro ao buscar lote."
            );

        }


        const lote =
            dados.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!lote) {

            mostrarMensagem(
                "Lote não encontrado.",
                "danger"
            );

            return;

        }


        // Preenche os dados atuais no modal.
        document.getElementById(
            "in-lote-id"
        ).value =
            lote.id;


        document.getElementById(
            "sel-lote-farmaco"
        ).value =
            lote.id_farmaco;


        document.getElementById(
            "in-lote-numero"
        ).value =
            lote.numero_lote;


        document.getElementById(
            "in-lote-fabricacao"
        ).value =
            converterDataParaInput(
                lote.data_fabricacao
            );


        document.getElementById(
            "in-lote-validade"
        ).value =
            converterDataParaInput(
                lote.data_validade
            );


        document.getElementById(
            "in-lote-quantidade"
        ).value =
            lote.quantidade;


        document.getElementById(
            "in-lote-capacidade"
        ).value =
            lote.capacidade;


        document.getElementById(
            "titulo-modal-lote"
        ).textContent =
            "Editar Lote";


        document.getElementById(
            "btn-save-lote"
        ).textContent =
            "Salvar Alterações";


        openModal(
            "modal-lote"
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar lote:",
            erro
        );


        mostrarMensagem(
            "Não foi possível carregar o lote para edição.",
            "danger"
        );

    }

}


// Função para excluir um lote.
//
// IMPORTANTE:
// O botão aparece como "Excluir",
// mas o backend deve apenas deixar
// o lote inativo no banco.
async function alterar_status_lote(id) {

    try {
        const resposta = await fetch(
            `/api/lotes/${id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            }
        );
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao alterar o status do lote.");
        }

        mostrarMensagem(dados.message || "Lote ativado com sucesso.", "success");
        await listar_lotes();
    } catch (erro) {
        mostrarMensagem(erro.message || "Não foi possível ativar o lote.", "danger");
    }
}


async function excluir_lote(id) {

    if (
        !confirm(
            "Deseja realmente excluir este lote?"
        )
    ) {

        return;

    }


    const token =
        localStorage.getItem("token");


    try {

        const resposta = await fetch(
            `/api/lotes/${id}`,
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
                "Erro ao excluir lote."
            );

        }


        mostrarMensagem(
            dados.message ||
            "Lote excluído com sucesso.",
            "success"
        );


        // Atualiza a tabela.
        await listar_lotes();


    } catch (erro) {

        console.error(
            "Erro ao excluir lote:",
            erro
        );


        mostrarMensagem(
            erro.message ||
            "Não foi possível excluir o lote.",
            "danger"
        );

    }

}


// Função para cancelar e limpar o formulário.
function cancelarLote() {

    document.getElementById(
        "in-lote-id"
    ).value = "";


    document.getElementById(
        "sel-lote-farmaco"
    ).value = "";


    document.getElementById(
        "in-lote-numero"
    ).value = "";


    document.getElementById(
        "in-lote-fabricacao"
    ).value = "";


    document.getElementById(
        "in-lote-validade"
    ).value = "";


    document.getElementById(
        "in-lote-quantidade"
    ).value = "";


    document.getElementById(
        "in-lote-capacidade"
    ).value = "";


    document.getElementById(
        "titulo-modal-lote"
    ).textContent =
        "Novo Lote";


    document.getElementById(
        "btn-save-lote"
    ).textContent =
        "Salvar Lote";


    closeModals();

}


// Formata a data para exibição na tabela.
function formatarData(data) {

    if (!data) {
        return "—";
    }


    const objetoData =
        new Date(data);


    if (isNaN(objetoData.getTime())) {
        return data;
    }


    return objetoData.toLocaleDateString(
        "pt-BR"
    );

}


// Converte a data recebida do backend
// para o formato aceito pelo input type="date".
function converterDataParaInput(data) {

    if (!data) {
        return "";
    }


    // Caso já venha no formato YYYY-MM-DD.
    if (
        /^\d{4}-\d{2}-\d{2}$/.test(data)
    ) {

        return data;

    }


    const objetoData =
        new Date(data);


    if (isNaN(objetoData.getTime())) {
        return "";
    }


    const ano =
        objetoData.getFullYear();


    const mes =
        String(
            objetoData.getMonth() + 1
        ).padStart(2, "0");


    const dia =
        String(
            objetoData.getDate()
        ).padStart(2, "0");


    return `${ano}-${mes}-${dia}`;

}