// A mesma composição do painel inicial do ZIP Ventek: 4 KPIs, coluna 8/12 e agenda 4/12.
import { Dados, MetricCardItem, Tab } from "../types";
import { diasValidade, data, numero } from "../lib/api";
import { GreetingHeader } from "./GreetingHeader";
import { QuickMetrics } from "./QuickMetrics";
import { StockOverviewChart } from "./StockOverviewChart";
import { PendingLots, PendingItem } from "./PendingLots";
import { ValiditySchedule, AgendaItem } from "./ValiditySchedule";
import { motion } from "motion/react";
export function Dashboard({
  dados,
  navegar,
}: {
  dados: Dados;
  navegar: (t: Tab) => void;
}) {
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
  const metrics: MetricCardItem[] = [
    {
      id: "1",
      value: `${numero(disponiveis)} ${disponiveis === 1 ? "unidade" : "unidades"}`,
      titlePt: "Unidades disponíveis no estoque",
      context: "",
      statusPt: "Disponível",
    },
    {
      id: "2",
      value: `${dados.farmacos.length} ${dados.farmacos.length === 1 ? "fármaco" : "fármacos"}`,
      titlePt: "Fármacos ativos em acompanhamento",
      context: "",
      statusPt: "Catálogo ativo",
    },
    {
      id: "3",
      value: `${alertas.length} ${alertas.length === 1 ? "lote" : "lotes"}`,
      titlePt: "Lotes que precisam de atenção",
      context: "",
      statusPt: alertas.length ? "Atenção Necessária" : "Em dia",
      statusType: alertas.length ? "warning" : "normal",
    },
    {
      id: "4",
      value: `${dados.movimentacoes.length} ${dados.movimentacoes.length === 1 ? "registro" : "registros"}`,
      titlePt: "Histórico de movimentações",
      context: "",
      statusPt: "Rastreabilidade",
    },
  ];
  const pendentes: PendingItem[] = alertas.map((l) => ({
    id: String(l.id),
    patientName: l.farmaco,
    sessionNumber: l.numero_lote,
    date: data(l.data_validade),
    subjective: `${l.quantidade} unidades em estoque · ${diasValidade(l.data_validade) < 0 ? "Lote vencido" : diasValidade(l.data_validade) === 0 ? "Vence hoje" : `Vence em ${diasValidade(l.data_validade)} dias`}`,
    isDraft: true,
    signedByCRP: false,
  }));
  const agenda: AgendaItem[] = lotes.map((l) => ({
    id: String(l.id),
    patientName: l.farmaco,
    time: data(l.data_validade),
    modality: "Online",
    status: diasValidade(l.data_validade) < 0 ? "Vencido" : "Ativo",
    therapeuticApproach: `Lote ${l.numero_lote} · ${l.quantidade} unidades`,
    notesSummary: "Validade registrada no controle de estoque",
    date: l.data_validade,
  }));
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const },
    },
  };
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.04 },
        },
      }}
      initial="hidden"
      animate="show"
      className="flex-1 flex flex-col space-y-6"
    >
      <motion.div variants={item}>
        <GreetingHeader lotes={lotes.length} alertas={alertas.length} />
      </motion.div>
      <motion.div variants={item}>
        <QuickMetrics metrics={metrics} />
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 min-w-0 flex flex-col space-y-6">
          <motion.div variants={item}>
            <StockOverviewChart dados={dados} />
          </motion.div>
          <motion.div id="alertas-validade" variants={item}>
            <PendingLots
              prontuarios={pendentes}
              onSignProntuario={() => navegar("lotes")}
              onOpenAllProntuarios={() => navegar("lotes")}
            />
          </motion.div>
        </div>
        <motion.div
          data-testid="validity-column"
          variants={item}
          className="lg:col-span-4 min-w-0"
        >
          <ValiditySchedule
            appointments={agenda}
            onOpenPatientDetails={() => navegar("lotes")}
            onOpenPreSessionNotes={() => navegar("lotes")}
            onStartTeleconsulta={() => navegar("lotes")}
            onOpenAppointmentDetail={() => navegar("lotes")}
          />
        </motion.div>
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
    <div className="p-6 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200/60">
      <h3>{titulo}</h3>
      <p className="mt-2 font-medium">{descricao}</p>
    </div>
  );
}
