import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Users,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import {
  shiftDate,
  formatDateBR,
  formatDayWithWeekday,
} from '../utils/timeCalculations';

interface StatsBannerProps {
  onQuickReallocateClick?: () => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ onQuickReallocateClick }) => {
  const {
    selectedDate,
    setSelectedDate,
    selectedUnitFilter,
    setSelectedUnitFilter,
    selectedTherapistFilter,
    setSelectedTherapistFilter,
    units,
    therapists,
    shifts,
    absences,
    violations,
  } = useSchedule();

  const handlePrevDay = () => setSelectedDate(shiftDate(selectedDate, -1));
  const handleNextDay = () => setSelectedDate(shiftDate(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);

  // Estatísticas para a data selecionada
  const dayShifts = shifts.filter((s) => s.date === selectedDate);
  const vacantShifts = dayShifts.filter((s) => s.isVacant);
  const coveredShifts = dayShifts.filter((s) => s.isCoverage);
  const dayViolations = violations.filter((v) => v.date === selectedDate);
  const severeViolations = dayViolations.filter((v) => v.severity === 'error');

  const activeAbsencesOnDate = absences.filter(
    (a) => selectedDate >= a.startDate && selectedDate <= a.endDate
  );

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Row 1: Date Navigation & Quick Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              title="Dia anterior"
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Hoje
            </button>

            <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-1 bg-slate-50">
              <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
              <span className="text-xs text-slate-500 font-medium pl-1 border-l border-slate-300">
                {formatDayWithWeekday(selectedDate)}
              </span>
            </div>

            <button
              onClick={handleNextDay}
              title="Próximo dia"
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Unit */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="text-xs rounded-md border border-slate-200 py-1 px-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="all">Todas as Unidades / Empresas</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Therapist */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTherapistFilter}
                onChange={(e) => setSelectedTherapistFilter(e.target.value)}
                className="text-xs rounded-md border border-slate-200 py-1 px-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="all">Todos os Fonoaudiólogos</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.crfa})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Status & Quick Insights Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
          {/* Card 1: Alocações */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium">Alocações no Dia</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {dayShifts.length}
              </span>
              <span className="text-xs text-slate-500">
                {coveredShifts.length > 0
                  ? `(${coveredShifts.length} substituição/cobertura)`
                  : 'escalas ativas'}
              </span>
            </div>
          </div>

          {/* Card 2: Vagas Abertas / Descobertas */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium">Vagas Descobertas</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-xl font-bold tabular-nums ${
                  vacantShifts.length > 0 ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {vacantShifts.length}
              </span>
              <span className="text-xs text-slate-500">
                {vacantShifts.length > 0 ? 'precisam de cobertura' : 'cobertura completa'}
              </span>
            </div>
          </div>

          {/* Card 3: Auditoria Legal CLT & 12h */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium">Conformidade Legal CLT & 12h</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {severeViolations.length === 0 ? (
                <div className="flex items-center gap-1 text-teal-700 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>100% Conforme (Teto 10h e 12h ok)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-700 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>
                    {severeViolations.length} inconformidade{severeViolations.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Afastamentos / Férias */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium">Férias / Licenças na Data</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-xl font-bold tabular-nums ${
                  activeAbsencesOnDate.length > 0 ? 'text-indigo-700' : 'text-slate-900'
                }`}
              >
                {activeAbsencesOnDate.length}
              </span>
              <span className="text-xs text-slate-500">
                {activeAbsencesOnDate.length === 1
                  ? 'profissional afastado(a)'
                  : activeAbsencesOnDate.length > 1
                  ? 'profissionais afastados'
                  : 'nenhum afastamento'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
