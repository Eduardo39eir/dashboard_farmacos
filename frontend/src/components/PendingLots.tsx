import React from "react";
export interface PendingItem {
  id: string;
  patientName: string;
  sessionNumber: string;
  date: string;
  subjective: string;
  isDraft: boolean;
  signedByCRP: boolean;
}
import { FileCheck2, Lock, ShieldCheck, ArrowUpRight } from "lucide-react";
import { PatientAvatar } from "./PatientAvatar";

interface PendingLotsProps {
  prontuarios: PendingItem[];
  onSignProntuario: (prontuario: PendingItem) => void;
  onOpenAllProntuarios: () => void;
}

export const PendingLots: React.FC<PendingLotsProps> = ({
  prontuarios,
  onSignProntuario,
  onOpenAllProntuarios,
}) => {
  const drafts = prontuarios.filter((p) => p.isDraft || !p.signedByCRP);

  return (
    <div className="sirion-card rounded-3xl p-6 flex flex-col justify-between h-full bg-white border border-slate-200/80 shadow-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              Lotes Pendentes de Atenção
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              Lotes com saldo vencidos ou a vencer em até 10 dias
            </p>
          </div>
        </div>

        <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/80 shrink-0">
          {drafts.length} {drafts.length === 1 ? "Registro" : "Registros"}
        </span>
      </div>

      {/* List of Pending Prontuarios */}
      <div className="space-y-3 my-2">
        {drafts.length === 0 ? (
          <div className="p-6 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200/60">
            Nenhum lote com saldo exige atenção à validade.
          </div>
        ) : (
          drafts.map((record) => (
            <div
              key={record.id}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-100/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <PatientAvatar name={record.patientName} size="md" />
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>{record.patientName}</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      (Lote {record.sessionNumber} • {record.date})
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 line-clamp-1 mt-0.5">
                    {record.subjective}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSignProntuario(record)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-2xs flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ver estoque</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Security Disclaimer & Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-blue-500" />
          <span>
            Validade inclusiva • alerta com até 10 dias de antecedência
          </span>
        </div>
        <button
          onClick={onOpenAllProntuarios}
          className="text-blue-600 hover:underline font-black flex items-center gap-1"
        >
          <span>Acessar Controle de Estoque</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
