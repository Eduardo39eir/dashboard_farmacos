import React, { useState, useRef } from "react";
import { Tab } from "../types";
type NavTab =
  | Tab
  | "ventek-ai"
  | "configuracoes"
  | "perfil"
  | "accounts"
  | "bot"
  | "revenue";
type UserRole = "psychologist" | "admin";
interface UserProfile {
  name: string;
  avatar: string;
}

import {
  Bell,
  Settings,
  Activity,
  Menu,
  X,
  UserCheck,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  onOpenVentekAI?: () => void;
  onResetPatientView?: () => void;
  currentUser: UserProfile;
}

const OriginalHeader: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
  onOpenProfile,
  onOpenVentekAI,
  onResetPatientView,
  currentUser,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const psychologistNavItems: { id: NavTab; label: string }[] = [
    { id: "dashboard", label: "Visão Geral" },
    { id: "lotes", label: "Estoque" },
    { id: "movimentacoes", label: "Movimentações" },
    { id: "farmacos", label: "Fármacos" },
    { id: "fornecedores", label: "Fornecedores" },
  ];

  const adminNavItems: { id: NavTab; label: string }[] = [
    { id: "dashboard", label: "Visão Geral" },
    { id: "accounts", label: "Equipe de Psicólogos" },
    { id: "bot", label: "Automação WhatsApp" },
    { id: "revenue", label: "Financeiro & Relatórios" },
  ];

  const navItems =
    userRole === "psychologist" ? psychologistNavItems : adminNavItems;

  const handleTabClick = (tabId: NavTab) => {
    if (tabId === "farmacos") {
      onResetPatientView?.();
    }
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    setActiveTab("dashboard");
    setRoleDropdownOpen(false);
  };

  return (
    <header className="relative w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-3 px-5 md:px-8 bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-sm transition-all duration-300 z-30">
      {/* Brand Logo & Mobile Toggle */}
      <div className="w-full xl:w-auto flex items-center justify-between gap-3">
        {/* Brand Logo - Ventek */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-0.5">
                SIG<span className="text-blue-500 font-black">IR</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5"></span>
              </span>
              {userRole === "admin" && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-100 font-mono font-black text-[10px] tracking-wider uppercase border border-slate-700 shadow-2xs">
                  [ ADMIN ]
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase -mt-1">
              Medicina Nuclear · UNESP
            </span>
          </div>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu de navegação"
            aria-expanded={mobileMenuOpen}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Navigation Pill Bar with Framer Motion Sliding Pill */}
      <nav className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 overflow-x-auto max-w-full relative">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              whileTap={{ scale: 0.96 }}
              className={`relative px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-colors duration-200 whitespace-nowrap z-10 cursor-pointer ${
                isActive
                  ? "text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={
                    userRole === "admin"
                      ? "adminTabPill"
                      : "activeHeaderTabPill"
                  }
                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-500/30 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              {item.label}
            </motion.button>
          );
        })}
      </nav>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="w-full xl:hidden flex flex-col gap-2 pt-3 pb-2 border-t border-slate-200 animate-fade-in">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-between ${
                  isActive
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                )}
              </button>
            );
          })}
          <button
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100"
            aria-label="Perfil do administrador"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenProfile?.();
            }}
          >
            Perfil e sessão
          </button>
        </div>
      )}

      {/* Right Controls: Ventek AI + Notifications + Settings + Profile */}
      <div className="hidden xl:flex items-center gap-3">
        {/* Ventek AI Button (Direct Navigation) */}
        <button
          onClick={() => {
            if (onOpenVentekAI) onOpenVentekAI();
            setActiveTab("ventek-ai");
          }}
          aria-label="Exportar relatório"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl transition-all text-xs font-black active:scale-95 cursor-pointer ${
            activeTab === "ventek-ai"
              ? "bg-blue-700 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-blue-500/20"
          }`}
        >
          <span>Relatório</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[9px] font-extrabold uppercase tracking-wider">
            CSV
          </span>
        </button>

        {/* Notifications Icon with Badge */}
        <button
          onClick={onOpenNotifications}
          aria-label="Notificações"
          className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all border border-slate-200/80 active:scale-95 cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        {/* Settings Icon - Circular Gear Icon on Right Controls */}
        <button
          onClick={() => {
            if (userRole === "admin") {
              setActiveTab("configuracoes");
            } else {
              onOpenSettings();
            }
          }}
          aria-label="Configurações"
          className={`p-2.5 rounded-2xl transition-all border active:scale-95 cursor-pointer ${
            activeTab === "configuracoes"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30"
              : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/80"
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar - Navigates to Dedicated Profile Page */}
        <button
          onClick={() =>
            onOpenProfile ? onOpenProfile() : setActiveTab("perfil")
          }
          aria-label="Perfil do administrador"
          className="relative group cursor-pointer focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm group-hover:scale-105 transition-transform duration-200">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name || "Perfil"}
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      </div>
    </header>
  );
};

// Mantém o menu do ZIP; somente as ações e os rótulos pertencem ao SIGIR.
export function Header({
  ativa,
  navegar,
  alertas,
  sair,
  abrirAlertas,
  exportar,
}: {
  ativa: Tab;
  navegar: (t: Tab) => void;
  alertas: number;
  sair: () => void;
  abrirAlertas: () => void;
  exportar: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [painel, setPainel] = useState("Configurações");
  const abrir = (titulo: string) => {
    setPainel(titulo);
    dialog.current?.showModal();
  };
  const selecionar = (tab: NavTab) => {
    if (tab === "configuracoes" || tab === "perfil")
      abrir(tab === "perfil" ? "Perfil do administrador" : "Configurações");
    else if (tab === "ventek-ai") exportar();
    else if (
      [
        "dashboard",
        "lotes",
        "movimentacoes",
        "farmacos",
        "fornecedores",
      ].includes(tab)
    )
      navegar(tab as Tab);
  };
  return (
    <>
      <OriginalHeader
        activeTab={ativa}
        setActiveTab={selecionar}
        userRole="psychologist"
        setUserRole={() => {}}
        unreadCount={alertas}
        onOpenNotifications={abrirAlertas}
        onOpenSettings={() => abrir("Configurações")}
        onOpenProfile={() => abrir("Perfil do administrador")}
        onOpenVentekAI={exportar}
        currentUser={{ name: "Administrador", avatar: "/avatar.svg" }}
      />
      <dialog ref={dialog} className="modal-card" aria-label={painel}>
        <h2 className="text-xl font-black mb-4">{painel}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          SIGIR · Medicina Nuclear UNESP
          <br />
          Perfil com acesso administrativo ao controle de estoque.
          <br />
          Banco de dados e credenciais são configurados no backend Flask local.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="secondary-button"
            onClick={() => dialog.current?.close()}
          >
            Fechar
          </button>
          <button
            className="primary-button"
            onClick={() => {
              dialog.current?.close();
              sair();
            }}
          >
            Sair
          </button>
        </div>
      </dialog>
    </>
  );
}
