import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Activity, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { Dados, Tab } from "./types";
import { api, carregarDados, diasValidade, exportarCsv } from "./lib/api";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { RecordsView } from "./components/RecordsView";
export default function App() {
  const [autenticado, setAutenticado] = useState(
    !!localStorage.getItem("token"),
  );
  const [aba, setAba] = useState<Tab>("dashboard");
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [atualizado, setAtualizado] = useState("");
  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setDados(await carregarDados());
      setAtualizado(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      setErro((e as Error).message);
      throw e;
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    const expirar = () => {
      setAutenticado(false);
      setDados(null);
      setErro("Sessão expirada. Entre novamente.");
    };
    window.addEventListener("sessao-expirada", expirar);
    return () => window.removeEventListener("sessao-expirada", expirar);
  }, []);
  useEffect(() => {
    if (autenticado) void recarregar().catch(() => {});
  }, [autenticado, recarregar]);
  const sair = () => {
    localStorage.removeItem("token");
    setDados(null);
    setAutenticado(false);
    setAba("dashboard");
    setErro("");
  };
  const navegar = (t: Tab) => {
    setAba(t);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-slate-50 text-slate-800 p-3 sm:p-5 md:p-8">
        <div className="max-w-[1600px] w-full mx-auto space-y-6">
          {!autenticado ? (
            <Login
              entrou={() => {
                setErro("");
                setAutenticado(true);
              }}
              mensagem={erro}
            />
          ) : (
            <>
              <Header
                exportar={() => {
                  if (dados) exportarCsv(dados.movimentacoes, "movimentacoes");
                }}
                ativa={aba}
                navegar={navegar}
                sair={sair}
                alertas={
                  dados?.lotes.filter(
                    (l) =>
                      l.quantidade > 0 && diasValidade(l.data_validade) <= 10,
                  ).length ?? 0
                }
                abrirAlertas={() => {
                  setAba("dashboard");
                  setTimeout(
                    () =>
                      document
                        .getElementById("alertas-validade")
                        ?.scrollIntoView({ behavior: "instant" }),
                    100,
                  );
                }}
              />
              {erro && (
                <div
                  role="alert"
                  className="error-message flex items-center gap-3"
                >
                  <AlertTriangle size={18} />
                  <button
                    className="secondary-button"
                    disabled={carregando}
                    onClick={() => void recarregar().catch(() => {})}
                  >
                    Tentar novamente
                  </button>
                  <span>
                    {erro}
                    {dados
                      ? " Os dados exibidos são da última consulta concluída."
                      : ""}
                  </span>
                </div>
              )}
              {carregando && !dados ? (
                <div
                  aria-label="Carregando painel"
                  aria-busy="true"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="sirion-card rounded-3xl p-7 h-56 animate-pulse"
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                      <div className="w-24 h-10 bg-slate-100 mt-6 rounded-xl" />
                      <div className="h-3 bg-slate-100 mt-5 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                dados && (
                  <AnimatePresence mode="wait">
                    <motion.main
                      key={aba}
                      initial={false}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {aba === "dashboard" ? (
                        <Dashboard dados={dados} navegar={navegar} />
                      ) : (
                        <RecordsView
                          recurso={aba}
                          dados={dados}
                          recarregar={recarregar}
                        />
                      )}
                    </motion.main>
                  </AnimatePresence>
                )
              )}
            </>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
function Login({ entrou, mensagem }: { entrou: () => void; mensagem: string }) {
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setCarregando(true);
    setErro("");
    try {
      const dados = await api("/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          senha: form.get("senha"),
        }),
      });
      localStorage.setItem("token", dados.token);
      entrou();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }
  return (
    <main className="min-h-[85vh] flex items-center justify-center">
      <section className="sirion-card rounded-3xl max-w-md w-full p-7 sm:p-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-7">
          <Activity size={28} />
        </div>
        <span className="text-xs font-extrabold tracking-widest text-blue-600">
          SIGIR · UNESP
        </span>
        <h1 className="text-3xl font-black tracking-tight mt-2">
          Bem-vindo de volta.
        </h1>
        <p className="caption mt-3 mb-7">
          Acesse o controle de estoque da Medicina Nuclear.
        </p>
        <form onSubmit={entrar} className="space-y-5">
          <label className="field-label">
            E-mail
            <input
              className="form-input"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="seu@email.com"
              required
            />
          </label>
          <label className="field-label">
            Senha
            <input
              className="form-input"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {(erro || mensagem) && (
            <p className="error-message" role="alert">
              {erro || mensagem}
            </p>
          )}
          <button
            className="primary-button w-full justify-between"
            disabled={carregando}
          >
            {carregando ? "Entrando…" : "Entrar no painel"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="caption mt-7 text-center">
          Acesso exclusivo para usuários autorizados.
        </p>
      </section>
    </main>
  );
}
