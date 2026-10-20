export type Tab =
  | "dashboard"
  | "lotes"
  | "farmacos"
  | "fornecedores"
  | "movimentacoes";
export type Registro = Record<string, any>;
export interface MetricCardItem {
  id: string;
  value: string;
  titlePt: string;
  context: string;
  statusPt: string;
  statusType?: "warning" | "normal";
}
export interface Dados {
  lotes: Registro[];
  farmacos: Registro[];
  fornecedores: Registro[];
  movimentacoes: Registro[];
}
