import React from "react";
import { MetricCardItem } from "../types";
import {
  Package,
  Pill,
  Truck,
  ArrowLeftRight,
  Activity,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface QuickMetricsProps {
  metrics: MetricCardItem[];
}

export const QuickMetrics: React.FC<QuickMetricsProps> = ({ metrics }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case "1":
        return <Package className="w-6 h-6 text-blue-600" />;
      case "2":
        return <Pill className="w-6 h-6 text-indigo-600" />;
      case "3":
        return <Truck className="w-6 h-6 text-amber-600" />;
      case "4":
        return <ArrowLeftRight className="w-6 h-6 text-emerald-600" />;
      default:
        return <Package className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusBadge = (card: MetricCardItem) => {
    if (card.statusType === "warning") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="whitespace-nowrap">{card.statusPt}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="whitespace-nowrap">{card.statusPt}</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {metrics.map((card) => (
        <div
          key={card.id}
          className="sirion-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group border border-slate-200/80 bg-white shadow-xs"
        >
          {/* Top Row: Icon Box + Status Badge with generous spacing */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100/90 group-hover:bg-blue-50 group-hover:scale-105 transition-all duration-200 flex items-center justify-center shrink-0">
              {getIcon(card.id)}
            </div>
            {getStatusBadge(card)}
          </div>

          {/* Middle Row: Large Number & Clear Title */}
          <div className="space-y-1.5 mb-6">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              {card.value}
            </div>
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider leading-relaxed">
              {card.titlePt}
            </p>
          </div>

          {/* Bottom Row: Sub-info Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-slate-400">
            <span>{card.context}</span>
            <div className="flex items-center gap-1 text-emerald-600 font-bold">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Estoque</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
