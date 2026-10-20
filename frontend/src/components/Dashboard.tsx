import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  CalendarDays,
  Download,
  Filter,
  Plus,
  Search,
  ArrowUpRight,
  Package,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { Dados, Tab } from "../types";
import { data, diasValidade, exportarCsv, numero } from "../lib/api";
export function Dashboard({
  dados,
  navegar,
}: {
  dados: Dados;
  navegar: (t: Tab) => void;
}) {
  const [periodo, setPeriodo] = useState(30);
  const [operacao, setOperacao] = useState("todos");
  const [busca, setBusca] = useState("");
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
  const disponiveis = lotes
    .filter((l) => diasValidade(l.data_validade) >= 0)
    .reduce((s, l) => s + l.quantidade, 0);
  const alertas = lotes
    .filter((l) => l.quantidade > 0 && diasValidade(l.data_validade) <= 10)
    .sort((a, b) => a.data_validade.localeCompare(b.data_validade));
  const serie = useMemo(
    () =>
      Array.from({ length: periodo }, (_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - periodo + i + 1);
        const itens = dados.movimentacoes.filter(
          (m) =>
            new Date(m.data_movimentacao).toDateString() === d.toDateString(),
        );
        return {
          data: d.toLocaleDateString("pt-BR"),
          dia: d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          entradas: itens
            .filter((m) => m.tipo_movimentacao === "Entrada")
            .reduce((s, m) => s + m.quantidade, 0),
          saidas: itens
            .filter((m) => m.tipo_movimentacao !== "Entrada")
            .reduce((s, m) => s + m.quantidade, 0),
        };
      }),
    [dados.movimentacoes, periodo],
  );
  const agrupados = Array.from({ length: 6 }, (_, i) => {
    const itens = serie.slice(
      Math.floor((i * serie.length) / 6),
      Math.floor(((i + 1) * serie.length) / 6),
    );
    return {
      dia: itens.at(-1)?.dia ?? "",
      entradas: itens.reduce((s, d) => s + d.entradas, 0),
      saidas: itens.reduce((s, d) => s + d.saidas, 0),
    };
  });
  const entradas = serie.reduce((s, d) => s + d.entradas, 0),
    saidas = serie.reduce((s, d) => s + d.saidas, 0);
  const total = lotes.length,
    emDia = lotes.filter((l) => diasValidade(l.data_validade) > 10).length;
  const saudavel = total ? Math.round((emDia / total) * 100) : 0;
  const fornecedores = dados.fornecedores
    .filter((f) =>
      f.nome.toLocaleLowerCase().includes(busca.toLocaleLowerCase()),
    )
    .slice(0, 3);
  const primeiro =
    lotes.find((l) => diasValidade(l.data_validade) >= 0) ?? lotes[0];
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };
  return (
    <motion.div
      className="youcare-dashboard"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      <div className="youcare-greeting">
        <h1>Olá, equipe UNESP!</h1>
        <button className="youcare-primary" onClick={() => navegar("lotes")}>
          <Plus size={15} />
          Novo lote
        </button>
      </div>
      <div className="youcare-toolbar">
        <div className="toolbar-left">
          <label className="toolbar-select">
            <Filter size={13} />
            <span className="sr-only">Tipo de movimentação</span>
            <select
              aria-label="Tipo de movimentação"
              value={operacao}
              onChange={(e) => setOperacao(e.target.value)}
            >
              <option value="todos">Todos os fluxos</option>
              <option value="entradas">Entradas</option>
              <option value="saidas">Saídas</option>
            </select>
          </label>
          <label className="toolbar-select">
            <CalendarDays size={13} />
            <span className="sr-only">Período</span>
            <select
              aria-label="Período"
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </label>
          <button onClick={() => exportarCsv(serie, `fluxo-${periodo}-dias`)}>
            <Download size={13} />
            Baixar dados
          </button>
        </div>
        <label className="youcare-search">
          <Search size={15} />
          <input
            aria-label="Buscar fornecedor no painel"
            placeholder="Buscar fornecedor"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        <span className="toolbar-status">
          <ShieldCheck size={13} />
          Estoque monitorado
        </span>
      </div>
      <div className="youcare-grid">
        <motion.section variants={item} className="youcare-card report-card">
          <div className="youcare-card-title">
            <h2>Fluxo do estoque</h2>
            <button
              className="youcare-chip"
              onClick={() => navegar("movimentacoes")}
            >
              Relatório
            </button>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Entradas
            </span>
            <span>
              <i className="pale" />
              Saídas
            </span>
          </div>
          <div className="mini-chart">
            <ResponsiveContainer>
              <LineChart
                data={serie}
                margin={{ top: 10, right: 4, left: -26, bottom: 0 }}
              >
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                  tick={{ fontSize: 9, fill: "#a1a8b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "#a1a8b8" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 12, border: 0 }}
                />
                {operacao !== "saidas" && (
                  <Line
                    name="Entradas"
                    type="monotone"
                    dataKey="entradas"
                    stroke="#5e89f9"
                    strokeWidth={1.7}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {operacao !== "entradas" && (
                  <Line
                    name="Saídas"
                    type="monotone"
                    dataKey="saidas"
                    stroke="#c7d8ff"
                    strokeWidth={1.7}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
        <motion.section variants={item} className="youcare-card blue-card">
          <div className="blue-card-top">
            <span className="blue-ring" />
            <span className="white-chip">Visão de hoje</span>
          </div>
          <h2>Cada lote importa</h2>
          <p>
            {alertas.length
              ? `${alertas.length} ${alertas.length === 1 ? "lote precisa" : "lotes precisam"} de atenção à validade. Confira as prioridades antes de movimentar o estoque.`
              : "Validades sob controle. Consulte seu estoque e acompanhe os próximos vencimentos."}
          </p>
          <button onClick={() => navegar("lotes")}>
            Consultar estoque
            <ArrowUpRight size={14} />
          </button>
          <div className="blue-slider">
            <i />
            <i />
            <i />
          </div>
        </motion.section>
        <motion.section variants={item} className="youcare-card health-card">
          <div className="youcare-card-title">
            <h2>Saúde do estoque</h2>
            <span aria-hidden="true">···</span>
          </div>
          <div className="health-number">
            <strong>{total ? saudavel + "%" : "—"}</strong>
            <span>{emDia} em dia</span>
          </div>
          <div className="mini-chart">
            <ResponsiveContainer>
              <AreaChart
                data={serie}
                margin={{ top: 5, left: 0, right: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="youcare-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6d96fb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6d96fb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={45}
                  tick={{ fontSize: 9, fill: "#a1a8b8" }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: 0, borderRadius: 12 }}
                />
                <Area
                  name="Unidades recebidas"
                  dataKey="entradas"
                  stroke="#759afa"
                  fill="url(#youcare-area)"
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="micro-copy">Lotes com validade acima de 10 dias</p>
        </motion.section>
        <motion.section
          id="alertas-validade"
          variants={item}
          className="youcare-card progress-card"
        >
          <div className="youcare-card-title">
            <h2>Próximas validades</h2>
            <span aria-hidden="true">···</span>
          </div>
          {alertas.length ? (
            alertas.slice(0, 2).map((l) => (
              <button
                className="expiry-item"
                key={l.id}
                onClick={() => navegar("lotes")}
              >
                <span className="calendar-icon">
                  <CalendarDays size={17} />
                </span>
                <div>
                  <strong>{data(l.data_validade)}</strong>
                  <small>
                    {l.farmaco} · {l.numero_lote}
                  </small>
                  <span className="expiry-track">
                    <i
                      style={{
                        width: `${(l.quantidade / l.capacidade) * 100}%`,
                      }}
                    />
                  </span>
                </div>
              </button>
            ))
          ) : (
            <Empty
              titulo="Nenhum alerta"
              descricao="As validades estão sob controle."
            />
          )}
        </motion.section>
        <motion.section
          variants={item}
          className="youcare-card information-card"
        >
          <div className="youcare-card-title">
            <h2>Informações do estoque</h2>
            <button className="youcare-chip" onClick={() => navegar("lotes")}>
              Detalhes
            </button>
          </div>
          <div className="stock-profile">
            <span>
              <Package size={20} />
            </span>
            <div>
              <strong>{primeiro?.farmaco ?? "Seu estoque"}</strong>
              <small>
                {primeiro
                  ? "Lote " + primeiro.numero_lote
                  : "Cadastre o primeiro lote"}
              </small>
            </div>
            <div className="stock-mark" aria-hidden="true">
              SIG
              <br />
              IR
            </div>
          </div>
          <div className="stock-details">
            <div>
              <span>Disponibilidade</span>
              <strong>{numero(disponiveis)} unidades</strong>
            </div>
            <div>
              <span>Fármacos ativos</span>
              <strong>{dados.farmacos.length} cadastrados</strong>
            </div>
            <div>
              <span>Entradas no período</span>
              <strong>{numero(entradas)} unidades</strong>
            </div>
            <div>
              <span>Saídas no período</span>
              <strong>{numero(saidas)} unidades</strong>
            </div>
          </div>
        </motion.section>
        <motion.section variants={item} className="youcare-card bars-card">
          <div className="youcare-card-title">
            <h2>Relatório de movimentações</h2>
            <button
              className="youcare-chip"
              onClick={() => navegar("movimentacoes")}
            >
              Detalhes
            </button>
          </div>
          <div className="chart-legend right">
            <span>
              <i className="pale" />
              Entradas
            </span>
            <span>
              <i />
              Saídas
            </span>
          </div>
          <div className="main-bar-chart">
            <ResponsiveContainer>
              <BarChart
                data={agrupados}
                barGap={-20}
                margin={{ top: 12, right: 4, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="youcare-bars" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1f59e8" />
                    <stop offset="100%" stopColor="#80a5ff" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f0f3fa" />
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9aa5b9" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#9aa5b9" }}
                />
                <Tooltip
                  cursor={{ fill: "#edf3ff", opacity: 0.5 }}
                  contentStyle={{
                    background: "#294974",
                    color: "white",
                    borderRadius: 12,
                    border: 0,
                    fontSize: 11,
                  }}
                />
                <ReferenceLine
                  y={entradas / 6}
                  stroke="#789ad4"
                  strokeDasharray="5 5"
                />
                {operacao !== "saidas" && (
                  <Bar
                    dataKey="entradas"
                    name="Entradas"
                    fill="#f1f6ff"
                    stroke="#dce7fc"
                    radius={[8, 8, 6, 6]}
                    maxBarSize={40}
                    isAnimationActive={false}
                  />
                )}
                {operacao !== "entradas" && (
                  <Bar
                    dataKey="saidas"
                    name="Saídas"
                    fill="url(#youcare-bars)"
                    radius={[8, 8, 6, 6]}
                    maxBarSize={40}
                    isAnimationActive={false}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="micro-copy">
            {periodo} dias · valores agrupados em seis intervalos
          </span>
        </motion.section>
        <motion.section variants={item} className="youcare-card suppliers-card">
          <div className="youcare-card-title">
            <h2>Fornecedores</h2>
            <button
              className="youcare-chip"
              onClick={() => navegar("fornecedores")}
            >
              Detalhes
            </button>
          </div>
          {fornecedores.length ? (
            fornecedores.map((f, i) => (
              <button
                className="supplier-item"
                key={f.id}
                onClick={() => navegar("fornecedores")}
              >
                <span
                  style={{ background: ["#edf3ff", "#eaf7f3", "#f4efff"][i] }}
                >
                  {f.nome.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>{f.nome}</strong>
                  <small>{f.email || f.telefone}</small>
                </div>
              </button>
            ))
          ) : (
            <Empty
              titulo="Nenhum fornecedor"
              descricao="Cadastre fornecedores para começar."
            />
          )}
        </motion.section>
      </div>
    </motion.div>
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
    <div className="youcare-empty">
      <strong>{titulo}</strong>
      <p>{descricao}</p>
    </div>
  );
}
