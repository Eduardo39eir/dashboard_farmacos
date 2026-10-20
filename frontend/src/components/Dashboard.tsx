// Layout, cartões e tratamento visual de gráficos adaptados dos painéis Ventek.
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Package,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Dados, MetricCardItem, Tab } from "../types";
import { data, diasValidade, exportarCsv, numero } from "../lib/api";
import { GreetingHeader } from "./GreetingHeader";
import { QuickMetrics } from "./QuickMetrics";
const cores = ["#3b82f6", "#f59e0b", "#f43f5e"];
export function Dashboard({
  dados,
  navegar,
}: {
  dados: Dados;
  navegar: (t: Tab) => void;
}) {
  const [periodo, setPeriodo] = useState(30);
  const [tipo, setTipo] = useState("todos");
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const lotes = dados.lotes.filter(
    (l) =>
      l.status &&
      new Date(l.data_fabricacao + "T00:00:00") <= hoje &&
      dados.farmacos.some(
        (f) =>
          f.id === l.id_farmaco &&
          f.status &&
          dados.fornecedores.some((s) => s.id === f.id_fornecedor && s.status),
      ),
  );
  const alertas = lotes
    .filter((l) => l.quantidade > 0 && diasValidade(l.data_validade) <= 10)
    .sort((a, b) => a.data_validade.localeCompare(b.data_validade));
  const disponiveis = lotes
    .filter((l) => diasValidade(l.data_validade) >= 0)
    .reduce((s, l) => s + l.quantidade, 0);
  const serie = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Array.from({ length: periodo }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() - (periodo - i - 1));
      const registros = dados.movimentacoes.filter(
        (m) =>
          new Date(m.data_movimentacao).toDateString() === d.toDateString(),
      );
      return {
        data: d.toLocaleDateString("pt-BR"),
        dia: d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        entradas: registros
          .filter((m) => m.tipo_movimentacao === "Entrada")
          .reduce((s, m) => s + m.quantidade, 0),
        saidas: registros
          .filter((m) => m.tipo_movimentacao !== "Entrada")
          .reduce((s, m) => s + m.quantidade, 0),
      };
    });
  }, [dados.movimentacoes, periodo]);
  const validade = [
    {
      nome: "Em dia",
      value: lotes.filter((l) => diasValidade(l.data_validade) > 10).length,
    },
    {
      nome: "Vencem em até 10 dias",
      value: lotes.filter(
        (l) =>
          diasValidade(l.data_validade) >= 0 &&
          diasValidade(l.data_validade) <= 10,
      ).length,
    },
    {
      nome: "Vencidos",
      value: lotes.filter((l) => diasValidade(l.data_validade) < 0).length,
    },
  ];
  const metrics: MetricCardItem[] = [
    {
      id: "1",
      value: numero(disponiveis),
      titlePt: "Unidades disponíveis",
      context: "Sem lotes vencidos",
      statusPt: "Disponibilidade",
    },
    {
      id: "2",
      value: numero(dados.farmacos.length),
      titlePt: "Fármacos ativos",
      context: "Catálogo de fármacos",
      statusPt: "Catálogo",
    },
    {
      id: "3",
      value: numero(dados.fornecedores.length),
      titlePt: "Fornecedores ativos",
      context: "Rede de fornecimento",
      statusPt: "Fornecimento",
    },
    {
      id: "4",
      value: numero(dados.movimentacoes.length),
      titlePt: "Movimentações",
      context: "Histórico completo",
      statusPt: "Rastreabilidade",
    },
  ];
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - periodo + 1);
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + 1);
  const recentes = dados.movimentacoes
    .filter(
      (m) =>
        new Date(m.data_movimentacao) >= inicio &&
        new Date(m.data_movimentacao) < fim,
    )
    .sort((a, b) => b.data_movimentacao.localeCompare(a.data_movimentacao))
    .slice(0, 5);
  return (
    <div className="space-y-6">
      <GreetingHeader lotes={lotes.length} alertas={alertas.length} />
      <QuickMetrics metrics={metrics} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="sirion-card rounded-3xl p-6 lg:col-span-8 space-y-5 min-w-0">
          <div className="flex flex-wrap justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex gap-3 items-center">
              <div className="icon-box">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="section-title">Movimentações do estoque</h2>
                <p className="caption">Entradas e saídas em unidades por dia</p>
              </div>
            </div>
            <fieldset className="flex bg-slate-100 p-1 rounded-xl">
              <legend className="sr-only">Período do gráfico</legend>
              {[7, 30, 90].map((p) => (
                <label key={p} className="relative cursor-pointer">
                  <input
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer"
                    type="radio"
                    name="periodo"
                    checked={periodo === p}
                    onChange={() => setPeriodo(p)}
                  />
                  <span className="block px-3 py-2 text-xs font-bold rounded-lg peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-blue-600">
                    {p} dias
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
          <div className="flex gap-2">
            {[
              { id: "todos", label: "Visão geral" },
              { id: "entradas", label: "Entradas" },
              { id: "saidas", label: "Saídas" },
            ].map((t) => (
              <button
                key={t.id}
                aria-pressed={tipo === t.id}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${tipo === t.id ? "bg-slate-900 text-white" : "text-slate-500 bg-slate-50"}`}
                onClick={() => setTipo(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={serie}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="entradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="saidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  minTickGap={28}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                {tipo !== "saidas" && (
                  <Area
                    type="monotone"
                    dataKey="entradas"
                    name="Entradas"
                    stroke="#3b82f6"
                    fill="url(#entradas)"
                    strokeWidth={2.5}
                    isAnimationActive={false}
                  />
                )}
                {tipo !== "entradas" && (
                  <Area
                    type="monotone"
                    dataKey="saidas"
                    name="Saídas"
                    stroke="#818cf8"
                    fill="url(#saidas)"
                    strokeWidth={2.5}
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-between border-t border-slate-100 pt-4">
            <span className="caption">
              Dados do período selecionado · unidades
            </span>
            <button
              className="text-link"
              onClick={() => exportarCsv(serie, `fluxo-${periodo}-dias`)}
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer font-bold">
              Ver valores do gráfico
            </summary>
            <div className="table-scroll max-h-48">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Entradas</th>
                    <th>Saídas</th>
                  </tr>
                </thead>
                <tbody>
                  {serie.map((s) => (
                    <tr key={s.data}>
                      <td>{s.data}</td>
                      <td>{s.entradas}</td>
                      <td>{s.saidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
        <section className="rounded-3xl p-6 lg:col-span-4 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-white shadow-xl shadow-blue-500/15 flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full border-[25px] border-white/10 pointer-events-none" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
              <AlertTriangle size={24} />
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-blue-100">
              Atenção ao estoque
            </span>
            <h2 className="text-2xl font-black mt-2 leading-tight">
              Cada lote importa.
              <br />
              Acompanhe a validade.
            </h2>
            <p className="text-sm text-blue-100 font-medium mt-4 leading-relaxed">
              {alertas.length
                ? `${alertas.length} lotes com saldo estão vencidos ou vencem nos próximos 10 dias.`
                : "Nenhum lote com saldo está vencido ou próximo do vencimento."}
            </p>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold mb-3">
              <span>Lotes em dia</span>
              <span>
                {validade[0].value} de {lotes.length}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="bg-white h-full rounded-full"
                style={{
                  width: `${lotes.length ? (validade[0].value / lotes.length) * 100 : 0}%`,
                }}
              />
            </div>
            <button
              onClick={() => navegar("lotes")}
              className="mt-6 w-full flex items-center justify-between bg-white/15 hover:bg-white/25 border border-white/20 p-3.5 rounded-2xl text-xs font-bold"
            >
              Consultar lotes
              <ArrowUpRight size={17} />
            </button>
          </div>
        </section>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="sirion-card rounded-3xl p-6 lg:col-span-4">
          <h2 className="section-title">Saúde do estoque</h2>
          <p className="caption mt-1">
            Distribuição de validade dos lotes ativos
          </p>
          {lotes.length ? (
            <>
              <div className="relative h-52">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={validade}
                      dataKey="value"
                      nameKey="nome"
                      innerRadius={62}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {validade.map((v, i) => (
                        <Cell key={v.nome} fill={cores[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <strong className="text-3xl font-black">
                    {lotes.length}
                  </strong>
                  <span className="caption">lotes ativos</span>
                </div>
              </div>
              <ul className="space-y-3">
                {validade.map((v, i) => (
                  <li
                    key={v.nome}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2 font-semibold text-slate-500">
                      <i
                        className="w-2 h-2 rounded-full"
                        style={{ background: cores[i] }}
                      />
                      {v.nome}
                    </span>
                    <strong>
                      {v.value}{" "}
                      <span className="text-slate-400 font-medium ml-2">
                        {Math.round((v.value / lotes.length) * 100)}%
                      </span>
                    </strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty
              titulo="Nenhum lote para analisar"
              descricao="Cadastre lotes para visualizar a distribuição de validade."
            />
          )}
        </section>
        <section
          id="alertas-validade"
          className="sirion-card rounded-3xl p-6 lg:col-span-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="section-title">Prioridades de validade</h2>
              <p className="caption mt-1">
                Lotes com saldo que precisam de atenção
              </p>
            </div>
            <span className="badge warning">{alertas.length}</span>
          </div>
          <div className="max-h-80 overflow-auto mt-4">
            {alertas.length ? (
              alertas.map((l) => (
                <div
                  key={l.id}
                  className="flex gap-3 items-center py-4 border-b border-slate-100"
                >
                  <div className="icon-box bg-amber-50 text-amber-600">
                    <Package size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold truncate">
                      {l.farmaco}
                    </p>
                    <p className="caption">
                      Lote {l.numero_lote} · {numero(l.quantidade)} un.
                    </p>
                  </div>
                  <span
                    className={`badge ${diasValidade(l.data_validade) < 0 ? "danger" : "warning"}`}
                  >
                    {diasValidade(l.data_validade) < 0
                      ? "Vencido"
                      : diasValidade(l.data_validade) === 0
                        ? "Vence hoje"
                        : `Em ${diasValidade(l.data_validade)} dias`}
                  </span>
                </div>
              ))
            ) : (
              <Empty
                titulo="Validades sob controle"
                descricao="Nenhum lote com saldo exige atenção neste momento."
              />
            )}
          </div>
        </section>
        <section className="sirion-card rounded-3xl p-6 lg:col-span-4">
          <h2 className="section-title">Últimas movimentações</h2>
          <p className="caption mt-1">
            As 5 mais recentes nos últimos {periodo} dias
          </p>
          <div className="mt-4">
            {recentes.length ? (
              recentes.map((m) => (
                <div
                  className="flex items-center gap-3 py-3 border-b border-slate-100"
                  key={m.id}
                >
                  <div
                    className={`icon-box ${m.tipo_movimentacao === "Entrada" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-500"}`}
                  >
                    {m.tipo_movimentacao === "Entrada" ? (
                      <ArrowDownLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold truncate">
                      {m.farmaco}
                    </p>
                    <p className="caption">
                      {m.nome_usuario || m.usuario} ·{" "}
                      {data(m.data_movimentacao)}
                    </p>
                  </div>
                  <strong className="text-xs">
                    {m.tipo_movimentacao === "Entrada" ? "+" : "−"}
                    {m.quantidade}
                  </strong>
                </div>
              ))
            ) : (
              <Empty
                titulo="Nenhuma movimentação"
                descricao="Não há entradas ou saídas no período selecionado."
              />
            )}
          </div>
          <button
            className="text-link mt-5"
            onClick={() => navegar("movimentacoes")}
          >
            Ver histórico completo
            <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </div>
  );
}
export function Empty({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="py-12 px-4 text-center">
      <Package size={28} className="text-slate-300 mx-auto mb-4" />
      <h3 className="text-sm font-extrabold text-slate-600">{titulo}</h3>
      <p className="caption mt-2 leading-relaxed max-w-64 mx-auto">
        {descricao}
      </p>
    </div>
  );
}
