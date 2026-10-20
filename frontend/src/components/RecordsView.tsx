// Tabelas, busca, botões e modal seguem a composição visual do Ventek.
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Pencil,
  Archive,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Dados, Registro, Tab } from "../types";
import { api, data, exportarCsv } from "../lib/api";
import { Empty } from "./Dashboard";
type Recurso = Exclude<Tab, "dashboard">;
type Campo = {
  nome: string;
  label: string;
  tipo?: string;
  opcoes?: { valor: string; label: string }[];
  obrigatorio?: boolean;
};
const titulos: Record<Recurso, string> = {
  lotes: "Estoque e lotes",
  farmacos: "Fármacos",
  fornecedores: "Fornecedores",
  movimentacoes: "Movimentações",
};
const singular: Record<Recurso, string> = {
  lotes: "lote",
  farmacos: "fármaco",
  fornecedores: "fornecedor",
  movimentacoes: "movimentação",
};
export function RecordsView({
  recurso,
  dados,
  recarregar,
}: {
  recurso: Recurso;
  dados: Dados;
  recarregar: () => Promise<void>;
}) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [exclusao, setExclusao] = useState<Registro | null>(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const colunas: Record<Recurso, { chave: string; label: string }[]> = {
    fornecedores: [
      { chave: "nome", label: "Fornecedor" },
      { chave: "cnpj", label: "CNPJ" },
      { chave: "telefone", label: "Telefone" },
      { chave: "email", label: "E-mail" },
    ],
    farmacos: [
      { chave: "nome", label: "Fármaco" },
      { chave: "fornecedor", label: "Fornecedor" },
      { chave: "status_validade", label: "Validade" },
    ],
    lotes: [
      { chave: "farmaco", label: "Fármaco" },
      { chave: "numero_lote", label: "Lote" },
      { chave: "data_fabricacao", label: "Fabricação" },
      { chave: "data_validade", label: "Validade" },
      { chave: "quantidade", label: "Saldo" },
      { chave: "capacidade", label: "Capacidade" },
      { chave: "status_validade", label: "Situação" },
    ],
    movimentacoes: [
      { chave: "farmaco", label: "Fármaco" },
      { chave: "numero_lote", label: "Lote" },
      { chave: "tipo_movimentacao", label: "Operação" },
      { chave: "quantidade", label: "Quantidade" },
      { chave: "nome_usuario", label: "Responsável" },
      { chave: "data_movimentacao", label: "Data" },
      { chave: "observacao", label: "Observação" },
    ],
  };
  const fornecedor: Campo = {
    nome: "id_fornecedor",
    label: "Fornecedor",
    opcoes: dados.fornecedores.map((f) => ({
      valor: String(f.id),
      label: f.nome,
    })),
  };
  const farmaco: Campo = {
    nome: "id_farmaco",
    label: "Fármaco",
    opcoes: dados.farmacos.map((f) => ({ valor: String(f.id), label: f.nome })),
  };
  const campos: Record<Recurso, Campo[]> = {
    fornecedores: [
      { nome: "nome", label: "Nome" },
      { nome: "cnpj", label: "CNPJ" },
      { nome: "telefone", label: "Telefone" },
      { nome: "email", label: "E-mail", tipo: "email" },
    ],
    farmacos: [{ nome: "nome", label: "Nome do fármaco" }, fornecedor],
    lotes: [
      farmaco,
      { nome: "numero_lote", label: "Número do lote" },
      { nome: "data_fabricacao", label: "Data de fabricação", tipo: "date" },
      { nome: "data_validade", label: "Data de validade", tipo: "date" },
      { nome: "quantidade", label: "Quantidade", tipo: "number" },
      { nome: "capacidade", label: "Capacidade", tipo: "number" },
    ],
    movimentacoes: [
      {
        nome: "id_lote",
        label: "Lote",
        opcoes: dados.lotes.map((l) => ({
          valor: String(l.id),
          label: `${l.farmaco} · ${l.numero_lote} (${l.quantidade} un.)`,
        })),
      },
      {
        nome: "tipo_movimentacao",
        label: "Operação",
        opcoes: [
          { valor: "Entrada", label: "Entrada" },
          { valor: "Saída", label: "Saída" },
        ],
      },
      { nome: "quantidade", label: "Quantidade", tipo: "number" },
      { nome: "observacao", label: "Observação", obrigatorio: false },
    ],
  };
  const filtrados = dados[recurso].filter((r) =>
    colunas[recurso].some((c) =>
      String(r[c.chave] ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(busca.toLocaleLowerCase("pt-BR")),
    ),
  );
  const paginas = Math.max(1, Math.ceil(filtrados.length / 10));
  const atual = Math.min(pagina, paginas);
  useEffect(() => {
    if (registro || exclusao) {
      setErro("");
      modal.current?.showModal();
    }
  }, [registro, exclusao]);
  const fechar = () => {
    if (salvando) return;
    modal.current?.close();
    setRegistro(null);
    setExclusao(null);
    setErro("");
  };
  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    const form = new FormData(e.currentTarget);
    try {
      if (exclusao)
        await api(`/${recurso}/${exclusao.id}`, {
          method: "DELETE",
          ...(recurso === "fornecedores"
            ? { body: JSON.stringify({ senha: form.get("senha") }) }
            : {}),
        });
      else {
        const payload = Object.fromEntries(
          campos[recurso].map((c) => [
            c.nome,
            c.tipo === "number" || c.nome.startsWith("id_")
              ? Number(form.get(c.nome))
              : form.get(c.nome),
          ]),
        );
        await api(`/${recurso}${registro?.id ? "/" + registro.id : ""}`, {
          method: registro?.id ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
      }
      modal.current?.close();
      setRegistro(null);
      setExclusao(null);
      setMensagem(
        exclusao
          ? "Operação concluída. O saldo foi atualizado quando aplicável."
          : "Registro salvo com sucesso.",
      );
      try {
        await recarregar();
      } catch {
        setMensagem(
          "Operação salva, mas a atualização da lista falhou. Use Atualizar dados.",
        );
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-blue-600 text-xs font-extrabold uppercase tracking-wider">
            Gestão do estoque
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-1">
            {titulos[recurso]}
          </h1>
          <p className="caption mt-2">
            {dados[recurso].length} registros · dados da API local
          </p>
        </div>
        <button className="primary-button" onClick={() => setRegistro({})}>
          <Plus size={17} />
          {recurso === "movimentacoes" ? "Nova" : "Novo"} {singular[recurso]}
        </button>
      </div>
      {mensagem && (
        <p className="notice" role="status">
          {mensagem}
        </p>
      )}
      <section className="sirion-card rounded-3xl overflow-hidden">
        <div className="p-5 flex flex-wrap justify-between gap-3 border-b border-slate-100">
          <label className="relative w-full sm:max-w-sm">
            <span className="sr-only">Buscar em {titulos[recurso]}</span>
            <Search
              size={17}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              className="form-input pl-10"
              placeholder={`Buscar em ${titulos[recurso].toLowerCase()}…`}
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
            />
          </label>
          <button
            className="secondary-button"
            disabled={!filtrados.length}
            onClick={() =>
              exportarCsv(
                filtrados.map((r) =>
                  Object.fromEntries(
                    colunas[recurso].map((c) => [c.label, r[c.chave]]),
                  ),
                ),
                recurso,
              )
            }
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
        {filtrados.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {colunas[recurso].map((c) => (
                    <th key={c.chave}>{c.label}</th>
                  ))}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.slice((atual - 1) * 10, atual * 10).map((r) => (
                  <tr key={r.id}>
                    {colunas[recurso].map((c) => (
                      <td key={c.chave}>
                        {c.chave.startsWith("data_") ? (
                          data(r[c.chave])
                        ) : c.chave === "status_validade" ? (
                          <span
                            className={`badge ${r[c.chave] === "Vencido" ? "danger" : r[c.chave] === "Quase vencendo" ? "warning" : ""}`}
                          >
                            {r[c.chave]}
                          </span>
                        ) : (
                          String(r[c.chave] ?? "—")
                        )}
                      </td>
                    ))}
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="icon-button"
                          aria-label={`Editar registro ${r.id}`}
                          onClick={() => setRegistro(r)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button text-rose-500"
                          aria-label={`Excluir registro ${r.id}`}
                          onClick={() => setExclusao(r)}
                        >
                          <Archive size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            titulo="Nenhum registro encontrado"
            descricao={
              busca
                ? "Tente outro termo de busca."
                : "Cadastre o primeiro item para começar."
            }
          />
        )}
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 text-xs font-bold text-slate-500">
          <span>
            {filtrados.length} resultados · página {atual} de {paginas}
          </span>
          <div className="flex gap-2">
            <button
              className="icon-button"
              aria-label="Página anterior"
              disabled={atual === 1}
              onClick={() => setPagina(atual - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Próxima página"
              disabled={atual === paginas}
              onClick={() => setPagina(atual + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <dialog
        ref={modal}
        onCancel={(e) => {
          e.preventDefault();
          fechar();
        }}
        onClose={() => {
          setRegistro(null);
          setExclusao(null);
        }}
        aria-labelledby="titulo-modal"
        className="modal-card"
      >
        <form
          onSubmit={salvar}
          key={`${recurso}-${registro?.id ?? "novo"}-${exclusao?.id ?? ""}`}
        >
          <div className="flex justify-between items-center gap-3 mb-2">
            <h2 id="titulo-modal" className="text-xl font-black">
              {exclusao
                ? "Confirmar exclusão"
                : registro?.id
                  ? "Editar " + singular[recurso]
                  : (recurso === "movimentacoes" ? "Nova " : "Novo ") +
                    singular[recurso]}
            </h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Fechar formulário"
              onClick={fechar}
              disabled={salvando}
            >
              <X size={18} />
            </button>
          </div>
          <p className="caption mb-6">
            {exclusao
              ? recurso === "movimentacoes"
                ? "O registro será removido e o saldo do lote será revertido."
                : "O item será inativado. Dependências podem ser inativadas em cascata."
              : "Preencha os dados. A API validará o registro antes de salvar."}
          </p>
          <div className="grid gap-4">
            {exclusao
              ? recurso === "fornecedores" && (
                  <label className="field-label">
                    Sua senha de confirmação
                    <input
                      className="form-input"
                      type="password"
                      name="senha"
                      autoComplete="current-password"
                      required
                    />
                  </label>
                )
              : campos[recurso].map((c) => (
                  <label className="field-label" key={c.nome}>
                    {c.label}
                    {c.obrigatorio === false ? " (opcional)" : ""}
                    {c.opcoes ? (
                      <select
                        className="form-input"
                        aria-label={c.label}
                        name={c.nome}
                        required
                        defaultValue={registro?.[c.nome] ?? ""}
                      >
                        <option value="" disabled>
                          Selecione…
                        </option>
                        {c.opcoes.map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        aria-label={
                          c.label +
                          (c.obrigatorio === false ? " (opcional)" : "")
                        }
                        name={c.nome}
                        type={c.tipo || "text"}
                        required={c.obrigatorio !== false}
                        min={
                          c.nome === "quantidade" && recurso === "lotes" ? 0 : 1
                        }
                        step={c.tipo === "number" ? 1 : undefined}
                        defaultValue={registro?.[c.nome] ?? ""}
                      />
                    )}
                  </label>
                ))}
          </div>
          {erro && (
            <p role="alert" className="error-message mt-4">
              {erro}
            </p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="secondary-button"
              type="button"
              onClick={fechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              className={`primary-button ${exclusao ? "bg-rose-600 hover:bg-rose-700" : ""}`}
              disabled={salvando}
            >
              {salvando
                ? "Salvando…"
                : exclusao
                  ? "Confirmar exclusão"
                  : "Salvar registro"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
