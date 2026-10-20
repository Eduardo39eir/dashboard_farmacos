import React, { useState } from "react";
import {
  Brain,
  TrendingDown,
  Sparkles,
  Activity,
  TrendingUp,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { Dados } from "../types";
import { diasValidade, exportarCsv } from "../lib/api";
export const StockOverviewChart: React.FC<{ dados: Dados }> = ({ dados }) => {
  const [timeframe, setTimeframe] = useState<
    "Semanal" | "Mensal" | "Trimestral"
  >("Semanal");
  const [metricView, setMetricView] = useState<"gad7" | "phq9" | "sessions">(
    "gad7",
  );
  const periodo =
    timeframe === "Semanal" ? 7 : timeframe === "Mensal" ? 30 : 90;
  const currentData = Array.from({ length: periodo }, (_, i) => {
    const dia = new Date();
    dia.setHours(0, 0, 0, 0);
    dia.setDate(dia.getDate() - (periodo - i - 1));
    const itens = dados.movimentacoes.filter(
      (m) =>
        new Date(m.data_movimentacao).toDateString() === dia.toDateString(),
    );
    return {
      name: dia.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      date: dia.toLocaleDateString("pt-BR"),
      gad7: itens
        .filter((m) => m.tipo_movimentacao === "Entrada")
        .reduce((s, m) => s + m.quantidade, 0),
      phq9: itens
        .filter((m) => m.tipo_movimentacao !== "Entrada")
        .reduce((s, m) => s + m.quantidade, 0),
      sessions: itens.length,
      status: "Registro do estoque",
    };
  });
  const entradas = currentData.reduce((s, d) => s + d.gad7, 0);
  const saidas = currentData.reduce((s, d) => s + d.phq9, 0);
  const registros = currentData.reduce((s, d) => s + d.sessions, 0);
  const getMetricKey = () => metricView;
  const getMetricLabel = () =>
    metricView === "gad7"
      ? "Entradas"
      : metricView === "phq9"
        ? "Saídas"
        : "Movimentações";
  const getMetricUnit = () =>
    metricView === "sessions" ? "registros" : "unidades";
  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = payload[0].value;
      return (
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-lg text-xs space-y-1 z-30 pointer-events-none min-w-[160px]">
          <div className="flex items-center justify-between text-slate-500 font-bold border-b border-slate-100 pb-1 mb-1">
            <span>
              {data.date} ({data.name})
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-slate-600 font-semibold">
              {getMetricLabel()}:
            </span>
            <span className="text-sm font-black text-blue-600">
              {value} {getMetricUnit()}
            </span>
          </div>
          <div className="pt-1 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-100">
              {data.status}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sirion-card rounded-3xl p-6 flex flex-col justify-between h-full bg-white border border-slate-200/80 shadow-xs">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Evolução do Estoque & Movimentações
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              Entradas, saídas e volume de movimentações do estoque
            </p>
          </div>
        </div>

        {/* Timeframe Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
            {(["Semanal", "Mensal", "Trimestral"] as const).map((tf) => {
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  aria-pressed={timeframe === tf}
                  onClick={() => setTimeframe(tf)}
                  className={`relative px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                    isActive
                      ? "text-white font-black"
                      : "text-slate-600 hover:text-slate-900 font-bold"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="chartTabPill"
                      className="absolute inset-0 bg-blue-600 rounded-lg shadow-xs z-0"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tf}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metric Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
              Entradas no período
            </span>
            <span className="text-xl font-black text-slate-900">
              {entradas.toLocaleString("pt-BR")} un.
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <TrendingDown className="w-3 h-3" /> Unidades recebidas
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Saídas no período
            </span>
            <span className="text-xl font-black text-slate-900">
              {saidas.toLocaleString("pt-BR")} un.
            </span>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-0.5 mt-0.5">
              <Activity className="w-3 h-3 text-blue-500" /> Unidades retiradas
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Movimentações
            </span>
            <span className="text-xl font-black text-slate-900">
              {registros.toLocaleString("pt-BR")}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Registros no período
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Metric Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 w-fit">
        {[
          { id: "gad7", label: "Entradas de fármacos" },
          { id: "phq9", label: "Saídas de fármacos" },
          { id: "sessions", label: "Movimentações" },
        ].map((m) => {
          const isActive = metricView === m.id;
          return (
            <button
              key={m.id}
              aria-pressed={metricView === m.id}
              onClick={() => setMetricView(m.id as any)}
              className={`relative px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                isActive
                  ? "text-white font-black"
                  : "text-slate-600 hover:text-slate-900 font-bold"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="chartMetricPill"
                  className="absolute inset-0 bg-slate-900 rounded-xl shadow-xs z-0"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* RECHARTS SMOOTH AREA SPLINE CHART CONTAINER */}
      <div className="w-full h-72 my-2 bg-gradient-to-b from-slate-50/60 to-transparent rounded-2xl p-2 border border-slate-100 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={currentData}
            margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorEvolucao" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
              opacity={0.6}
            />

            <XAxis
              dataKey="name"
              minTickGap={28}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
              dy={8}
            />

            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
              dx={-5}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#cbd5e1",
                strokeWidth: 1.5,
                strokeDasharray: "3 3",
              }}
            />

            <Area
              type="monotone"
              isAnimationActive={false}
              dataKey={getMetricKey()}
              stroke="#2563eb"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorEvolucao)"
              activeDot={{
                r: 6,
                fill: "#2563eb",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              dot={{
                r: 3.5,
                fill: "#ffffff",
                stroke: "#2563eb",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Movimentações registradas pelo controle de estoque SIGIR</span>
        </div>
        <button
          onClick={() =>
            exportarCsv(
              currentData.map((d) => ({
                Data: d.date,
                Entradas: d.gad7,
                Saídas: d.phq9,
                Movimentações: d.sessions,
              })),
              `fluxo-${periodo}-dias`,
            )
          }
          className="text-blue-600 font-black flex items-center gap-1 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Exportar dados do período
        </button>
      </div>
    </div>
  );
};
