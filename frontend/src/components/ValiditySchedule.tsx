import React, { useState, useRef, useEffect } from "react";
export interface AgendaItem {
  id: string;
  patientName: string;
  time: string;
  modality: "Online" | "Presencial";
  status: string;
  therapeuticApproach: string;
  notesSummary: string;
  date: string;
}

import {
  Calendar,
  Video,
  MapPin,
  Sparkles,
  ChevronRight,
  PlayCircle,
  Bot,
  Clock,
  ChevronLeft,
  ChevronDown,
  X,
} from "lucide-react";
import { PatientAvatar } from "./PatientAvatar";
import { motion, AnimatePresence } from "motion/react";

interface ValidityScheduleProps {
  appointments: AgendaItem[];
  onOpenPatientDetails: (patientName: string) => void;
  onOpenPreSessionNotes: (app: AgendaItem) => void;
  onStartTeleconsulta: (app: AgendaItem) => void;
  onOpenAppointmentDetail?: (app: AgendaItem) => void;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEK_DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Baseline system date (Today)
const TODAY_YEAR = new Date().getFullYear();
const TODAY_MONTH_INDEX = new Date().getMonth(); // 1 = Fevereiro (0-indexed)
const TODAY_DAY_NUM = new Date().getDate();

export const ValiditySchedule: React.FC<ValidityScheduleProps> = ({
  appointments,
  onOpenPatientDetails,
  onOpenPreSessionNotes,
  onStartTeleconsulta,
  onOpenAppointmentDetail,
}) => {
  // Month & Day navigation state
  const [currentYear, setCurrentYear] = useState<number>(TODAY_YEAR);
  const [currentMonthIndex, setCurrentMonthIndex] =
    useState<number>(TODAY_MONTH_INDEX); // 1 = Fevereiro
  const [selectedDayNumber, setSelectedDayNumber] =
    useState<number>(TODAY_DAY_NUM);
  const [isCalendarModalOpen, setIsCalendarModalOpen] =
    useState<boolean>(false);

  const daysContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const dragDistanceRef = useRef<number>(0);

  // Mouse drag-to-scroll handlers for natural side-to-side pulling
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!daysContainerRef.current) return;
    setIsDragging(true);
    startXRef.current = e.pageX - daysContainerRef.current.offsetLeft;
    scrollLeftRef.current = daysContainerRef.current.scrollLeft;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !daysContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - daysContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.6;
    dragDistanceRef.current = Math.abs(walk);
    daysContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleDayClick = (dayNum: number) => {
    if (dragDistanceRef.current < 6) {
      setSelectedDayNumber(dayNum);
    }
  };

  // Auto-scroll selected day into view in the horizontal day bar
  useEffect(() => {
    if (daysContainerRef.current) {
      const activeEl = daysContainerRef.current.querySelector(
        '[data-selected="true"]',
      );
      if (activeEl) {
        daysContainerRef.current.scrollLeft =
          (activeEl as HTMLElement).offsetLeft -
          daysContainerRef.current.offsetLeft -
          daysContainerRef.current.clientWidth / 2 +
          (activeEl as HTMLElement).clientWidth / 2;
      }
    }
  }, [selectedDayNumber, currentMonthIndex, currentYear]);

  // Helpers for month calculation
  const getDaysInMonth = (year: number, monthIndex: number) => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, monthIndex: number) => {
    return new Date(year, monthIndex, 1).getDay();
  };

  // Month Navigation: switches month and auto-resets day selection to day 1
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
    setSelectedDayNumber(1);
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
    setSelectedDayNumber(1);
  };

  // Shortcut to instantly reset view to Today
  const handleGoToToday = () => {
    setCurrentYear(TODAY_YEAR);
    setCurrentMonthIndex(TODAY_MONTH_INDEX);
    setSelectedDayNumber(TODAY_DAY_NUM);
  };

  const selectedDate = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}-${String(selectedDayNumber).padStart(2, "0")}`;
  const itensDoDia = appointments.filter((app) => app.date === selectedDate);
  useEffect(() => {
    if (!isCalendarModalOpen) return;
    const fechar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCalendarModalOpen(false);
    };
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [isCalendarModalOpen]);
  const currentMonthName = MONTH_NAMES[currentMonthIndex];
  const totalDaysInCurrentMonth = getDaysInMonth(
    currentYear,
    currentMonthIndex,
  );

  // Generate full list of days for horizontal bar
  const monthDaysList = Array.from(
    { length: totalDaysInCurrentMonth },
    (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(currentYear, currentMonthIndex, dayNum);
      const dayName = WEEK_DAY_NAMES[dateObj.getDay()];
      return { dayNum, dayName };
    },
  );

  return (
    <div className="sirion-card rounded-3xl p-5 flex flex-col justify-between bg-white border border-slate-200/80 shadow-xs relative gap-2.5">
      {/* Header Row: Title & Month Selector Navigation */}
      <div className="space-y-2.5 mb-2.5 border-b border-slate-100/90 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Validade dos Lotes
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                Calendário de vencimentos do estoque
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-black shrink-0">
            {itensDoDia.length} {itensDoDia.length === 1 ? "Lote" : "Lotes"}
          </span>
        </div>

        {/* Month Selector Bar (< Mês / Ano > + "Ir para Hoje") */}
        <div className="p-2 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
          {/* Previous Month Arrow */}
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Mês anterior (reseta para o dia 1)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Interactive Month/Year Box & "Ir para Hoje" Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-900 font-black text-xs transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 group active:scale-95"
              title="Abrir Calendário Mensal Completo"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>
                {currentMonthName} {currentYear}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
            </button>

            <button
              type="button"
              onClick={handleGoToToday}
              className="p-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-black shadow-2xs active:scale-95 shrink-0"
              title="Ir para Hoje (Data atual do sistema)"
            >
              <Clock className="w-3 h-3 text-blue-600" />
              <span>Hoje</span>
            </button>
          </div>

          {/* Next Month Arrow */}
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Próximo mês (reseta para o dia 1)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Draggable/Scrollable Days Bar */}
        <div
          ref={daysContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 scrollbar-none snap-x select-none relative transition-cursor ${
            isDragging
              ? "cursor-grabbing"
              : "cursor-grab active:cursor-grabbing"
          }`}
        >
          {monthDaysList.map((d) => {
            const isSelected = d.dayNum === selectedDayNumber;
            const isToday =
              d.dayNum === TODAY_DAY_NUM &&
              currentMonthIndex === TODAY_MONTH_INDEX &&
              currentYear === TODAY_YEAR;

            return (
              <motion.button
                key={`${d.dayName}-${d.dayNum}`}
                type="button"
                data-selected={isSelected ? "true" : "false"}
                onClick={() => handleDayClick(d.dayNum)}
                whileTap={{ scale: 0.95 }}
                className={`relative px-3 py-1.5 rounded-xl flex flex-col items-center min-w-[46px] transition-colors cursor-pointer shrink-0 snap-center select-none ${
                  isSelected
                    ? "text-white font-black"
                    : isToday
                      ? "bg-blue-50 text-blue-700 border border-blue-300/80 font-black"
                      : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60 font-extrabold"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="homeScheduleDayPill"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`text-[10px] uppercase tracking-wider relative z-10 ${
                    isSelected ? "opacity-90" : "opacity-70"
                  }`}
                >
                  {d.dayName}
                </span>
                <span className="text-xs font-black relative z-10">
                  {d.dayNum}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Appointments List with Top & Bottom Gradient Mask Overlays */}
      <div className="relative pt-0.5 flex-1 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="space-y-2.5 pt-0.5 pb-0.5 overflow-y-auto max-h-[420px] pr-1">
          {itensDoDia.length === 0 && (
            <div className="p-6 text-center text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200/60">
              Nenhum lote vence neste dia.
            </div>
          )}
          {itensDoDia.map((app, index) => {
            const isOngoing = app.status === "Vencido";

            return (
              <div
                key={app.id}
                onClick={() =>
                  onOpenAppointmentDetail
                    ? onOpenAppointmentDetail(app)
                    : onOpenPatientDetails(app.patientName)
                }
                className={`p-4 rounded-2xl transition-all duration-200 cursor-pointer group ${
                  isOngoing
                    ? "bg-blue-50/80 border-2 border-blue-500/40 shadow-xs"
                    : "bg-white border border-slate-200/80 hover:bg-slate-50 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Side: Avatar + Name/Status + Approach + Notes */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <PatientAvatar name={app.patientName} size="md" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                          {app.patientName}
                        </h3>
                        {isOngoing ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <PlayCircle className="w-3 h-3" /> Vencido
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold">
                            {app.time}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-500 truncate">
                        {app.therapeuticApproach}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate italic">
                        "{app.notesSummary}"
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Single Action Control */}
                  <div className="shrink-0 flex items-center self-end sm:self-center">
                    {app.modality === "Online" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenAppointmentDetail) {
                            onOpenAppointmentDetail(app);
                          } else {
                            onStartTeleconsulta(app);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Ver estoque</span>
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-extrabold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>Lote ativo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
      </div>

      {/* Footer Nav Link - Pulled closer to appointments list */}
      <div className="pt-2 mt-0.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs font-extrabold shrink-0">
        <span className="text-slate-400">
          Validades registradas no estoque SIGIR
        </span>
        <button
          onClick={() => onOpenPatientDetails("")}
          className="text-blue-600 hover:underline flex items-center gap-1 font-black cursor-pointer"
        >
          <span>Abrir Estoque de Fármacos</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* FULL MONTHLY CALENDAR MODAL */}
      <AnimatePresence>
        {isCalendarModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsCalendarModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="Calendário mensal"
              className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Calendário Mensal Completo
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">
                      Selecione um dia para filtrar
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Month Navigator inside Modal */}
              <div className="p-2 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-black text-slate-900 tracking-tight">
                  {currentMonthName} {currentYear}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95"
                  title="Próximo Mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday Names Header */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEK_DAY_NAMES.map((wd) => (
                  <span
                    key={wd}
                    className="text-[10px] font-black text-slate-400 uppercase py-1"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Monthly Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Empty Offset Slots */}
                {Array.from({
                  length: getFirstDayOfWeek(currentYear, currentMonthIndex),
                }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}

                {/* Day Buttons */}
                {Array.from({ length: totalDaysInCurrentMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = dayNum === selectedDayNumber;
                  const isToday =
                    dayNum === TODAY_DAY_NUM &&
                    currentMonthIndex === TODAY_MONTH_INDEX &&
                    currentYear === TODAY_YEAR;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => {
                        setSelectedDayNumber(dayNum);
                        setIsCalendarModalOpen(false);
                      }}
                      className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white font-black shadow-md scale-105"
                          : isToday
                            ? "bg-blue-50 text-blue-700 border border-blue-300 font-black"
                            : "hover:bg-slate-100 text-slate-700 font-bold"
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleGoToToday();
                    setIsCalendarModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ir para Hoje</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-2xs transition-all cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
