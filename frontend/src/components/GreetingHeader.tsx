// Composição reutilizada do PsychologistGreetingHeader.tsx do Ventek.
import { Sparkles, Package, AlertTriangle } from "lucide-react";
export function GreetingHeader({
  lotes,
  alertas,
}: {
  lotes: number;
  alertas: number;
}) {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-200/60 pb-5">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black tracking-wide border border-blue-200/60 flex items-center gap-1">
            <Sparkles size={12} />
            Painel de Gestão SIGIR
          </span>
          <span className="text-xs font-extrabold text-slate-400">
            • Estoque de fármacos
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Olá, <span className="text-blue-600">equipe UNESP!</span>
        </h1>
        <p className="text-sm font-semibold text-slate-500">
          Uma visão completa do estoque para cuidar de cada detalhe.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="summary-chip">
          <Package size={18} className="text-blue-600" />
          <div>
            <strong>{lotes} lotes ativos</strong>
            <small>Controle de estoque</small>
          </div>
        </div>
        <div className="summary-chip bg-amber-50 border-amber-200">
          <AlertTriangle size={18} className="text-amber-600" />
          <div>
            <strong>{alertas} com atenção</strong>
            <small>Validade dos lotes com saldo</small>
          </div>
        </div>
      </div>
    </div>
  );
}
