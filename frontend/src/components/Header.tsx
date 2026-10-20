// Adaptado do Header.tsx do projeto Ventek enviado pelo autor.
import { useState } from "react";
import { Activity, Bell, Menu, X, LogOut, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Tab } from "../types";
export const abas: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Visão Geral" },
  { id: "lotes", label: "Estoque" },
  { id: "farmacos", label: "Fármacos" },
  { id: "fornecedores", label: "Fornecedores" },
  { id: "movimentacoes", label: "Movimentações" },
];
export function Header({
  ativa,
  navegar,
  alertas,
  sair,
  abrirAlertas,
}: {
  ativa: Tab;
  navegar: (t: Tab) => void;
  alertas: number;
  sair: () => void;
  abrirAlertas: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <header className="relative w-full flex flex-wrap xl:flex-nowrap xl:items-center justify-between gap-4 py-3 px-5 md:px-8 bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-sm z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Activity className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight text-slate-900">
            SIG<span className="text-blue-500">IR</span>
            <span className="text-blue-500">.</span>
          </div>
          <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
            Medicina Nuclear · UNESP
          </p>
        </div>
      </div>
      <button
        className="icon-button md:hidden ml-auto"
        aria-label="Menu de navegação"
        aria-expanded={aberto}
        aria-controls="navegacao"
        onClick={() => setAberto(!aberto)}
      >
        {aberto ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav
        id="navegacao"
        aria-label="Navegação principal"
        className={`${aberto ? "flex" : "hidden"} md:flex flex-wrap items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 w-full md:w-auto order-last md:order-none`}
      >
        {abas.map((a) => (
          <motion.button
            key={a.id}
            whileTap={{ scale: 0.96 }}
            aria-current={ativa === a.id ? "page" : undefined}
            onClick={() => {
              navegar(a.id);
              setAberto(false);
            }}
            className={`relative px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap isolate ${ativa === a.id ? "text-white" : "text-slate-600 hover:bg-white/50"}`}
          >
            {ativa === a.id && (
              <motion.span
                layoutId="activeHeaderTabPill"
                className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-500/30 -z-10"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            {a.label}
          </motion.button>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <span className="hidden lg:flex items-center gap-1.5 mr-2 text-[10px] font-extrabold text-slate-500">
          <ShieldCheck size={15} className="text-blue-600" />
          Administrador
        </span>
        <button
          className="icon-button relative"
          onClick={abrirAlertas}
          aria-label={`Alertas de validade: ${alertas}`}
        >
          <Bell size={18} />
          {alertas > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] px-1.5 rounded-full">
              {alertas}
            </span>
          )}
        </button>
        <button className="icon-button" onClick={sair} aria-label="Sair">
          <LogOut size={18} />
        </button>
        <div
          className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black border-2 border-white shadow-sm"
          aria-label="Perfil administrador"
        >
          AD
        </div>
      </div>
    </header>
  );
}
