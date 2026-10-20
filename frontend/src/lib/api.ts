import { Dados, Registro } from "../types";
export async function api(caminho: string, opcoes: RequestInit = {}) {
  let resposta: Response;
  try {
    resposta = await fetch("/api" + caminho, {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {}),
        ...opcoes.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Verifique se o Flask está executando.",
    );
  }
  const dados = await resposta.json().catch(() => ({}));
  if (resposta.status === 401 && caminho !== "/login") {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("sessao-expirada"));
  }
  if (!resposta.ok)
    throw new Error(
      dados.erro ||
        dados.error ||
        dados.msg ||
        "Não foi possível concluir a operação.",
    );
  return dados;
}
export async function carregarDados(): Promise<Dados> {
  const [lotes, farmacos, fornecedores, movimentacoes] = await Promise.all([
    api("/lotes"),
    api("/farmacos"),
    api("/fornecedores"),
    api("/movimentacoes"),
  ]);
  for (const itens of [lotes, farmacos, fornecedores, movimentacoes])
    if (!Array.isArray(itens))
      throw new Error("A API retornou dados inválidos.");
  return { lotes, farmacos, fornecedores, movimentacoes };
}
export const numero = (v: number) => v.toLocaleString("pt-BR");
export const data = (v: string) =>
  v
    ? new Date(v.length === 10 ? v + "T12:00:00" : v).toLocaleDateString(
        "pt-BR",
      )
    : "—";
export function diasValidade(v: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round(
    (new Date(v + "T00:00:00").getTime() - hoje.getTime()) / 86400000,
  );
}
export function exportarCsv(registros: Registro[], nome: string) {
  if (!registros.length) return;
  const chaves = Object.keys(registros[0]);
  const celula = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const texto = [
    chaves,
    ...registros.map((item) => chaves.map((chave) => item[chave])),
  ]
    .map((linha) => linha.map(celula).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + texto], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = nome + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
