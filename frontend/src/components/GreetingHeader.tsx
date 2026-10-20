import React from "react";
import { Sparkles, CalendarCheck, FileSignature } from "lucide-react";

interface GreetingHeaderProps {
  lotes: number;
  alertas: number;
}
export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  lotes,
  alertas,
}) => {
  const todayCount = lotes;
  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-200/60 pb-5">
      {/* Left Side: Clean Greeting & CRP Badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black tracking-wide border border-blue-200/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Painel de Estoque SIGIR
          </span>
          <span className="text-xs font-extrabold text-slate-400">
            • Medicina Nuclear · UNESP
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Olá, <span className="text-blue-600">equipe UNESP</span>
        </h1>

        <p className="text-sm font-semibold text-slate-500">
          Você tem{" "}
          <span className="text-blue-600 font-extrabold">
            {todayCount} {todayCount === 1 ? "lote ativo" : "lotes ativos"}
          </span>{" "}
          no estoque •{" "}
          <span className="text-amber-600 font-bold">
            {alertas} {alertas === 1 ? "lote com atenção" : "lotes com atenção"}
          </span>{" "}
          à validade.
        </p>
      </div>

      {/* Right Side: Discreet Summary Indicators */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <CalendarCheck className="w-4 h-4 text-blue-600" />
          <div className="text-xs">
            <span className="font-extrabold text-slate-900 block">
              {todayCount} {todayCount === 1 ? "Lote" : "Lotes"}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              {new Date().toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-2xs">
          <FileSignature className="w-4 h-4 text-amber-600" />
          <div className="text-xs">
            <span className="font-extrabold text-amber-900 block">
              {alertas} {alertas === 1 ? "Pendente" : "Pendentes"}
            </span>
            <span className="text-[10px] text-amber-700/80 font-bold">
              Controle de validade
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
