import { useRef, useState } from "react";
import { Bell, Settings, Menu, X, LogOut, Download } from "lucide-react";
import { motion } from "motion/react";
import { Tab } from "../types";
const abas: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "lotes", label: "Estoque" },
  { id: "movimentacoes", label: "Movimentações" },
  { id: "farmacos", label: "Fármacos" },
  { id: "fornecedores", label: "Fornecedores" },
];
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
  const [aberto, setAberto] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <header className="youcare-header">
        <div className="youcare-brand">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <circle
                key={i}
                cx={20 + 10 * Math.cos((i * Math.PI) / 3)}
                cy={20 + 10 * Math.sin((i * Math.PI) / 3)}
                r="6"
                fill={i % 2 ? "#5085ff" : "#2862ee"}
              />
            ))}
            <circle cx="20" cy="20" r="5" fill="#aec8ff" />
          </svg>
          <strong>
            SIGIR<span>UNESP</span>
          </strong>
        </div>
        <nav
          aria-label="Navegação principal"
          className={`youcare-nav ${aberto ? "is-open" : ""}`}
        >
          {abas.map((a) => (
            <motion.button
              key={a.id}
              whileTap={{ scale: 0.97 }}
              aria-current={ativa === a.id ? "page" : undefined}
              onClick={() => {
                navegar(a.id);
                setAberto(false);
              }}
              className={ativa === a.id ? "active" : ""}
            >
              {ativa === a.id && (
                <motion.span
                  className="nav-pill"
                  layoutId="youcare-menu"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span>{a.label}</span>
            </motion.button>
          ))}
        </nav>
        <div className="youcare-header-actions">
          <button
            aria-label="Configurações"
            onClick={() => dialog.current?.showModal()}
          >
            <Settings size={17} />
          </button>
          <button
            className="notification"
            aria-label={`Alertas de validade: ${alertas}`}
            onClick={abrirAlertas}
          >
            <Bell size={17} />
            {alertas > 0 && <i />}
          </button>
          <button
            aria-label="Perfil do administrador"
            onClick={() => dialog.current?.showModal()}
          >
            <img src="/static/painel/avatar.svg" alt="Administrador" />
          </button>
          <button
            className="mobile-menu"
            aria-label="Menu de navegação"
            aria-expanded={aberto}
            onClick={() => setAberto(!aberto)}
          >
            {aberto ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>
      <dialog className="modal-card" ref={dialog} aria-label="Configurações">
        <h2 className="text-xl font-bold mb-4">Sua sessão</h2>
        <p className="text-sm text-slate-500">
          Administrador · Medicina Nuclear UNESP
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <button className="secondary-button" onClick={exportar}>
            <Download size={15} />
            Exportar movimentações
          </button>
          <button
            className="primary-button"
            onClick={() => {
              dialog.current?.close();
              sair();
            }}
          >
            <LogOut size={15} />
            Sair
          </button>
          <button
            className="secondary-button"
            onClick={() => dialog.current?.close()}
          >
            Fechar
          </button>
        </div>
      </dialog>
    </>
  );
}
