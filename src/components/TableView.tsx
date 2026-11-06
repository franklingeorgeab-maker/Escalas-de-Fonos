import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Calendar,
  Sun,
  ChevronLeft,
  ChevronRight,
  CalendarOff,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Building2,
  Zap,
  UserPlus,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ShiftEntry, Therapist, WorkUnit } from '../types';
import {
  getWeekDates,
  getWeekdayLabel,
  formatMinutesToHours,
  calculateShiftDuration,
  calculateInterjornadaRest,
  shiftDate,
  shiftMonth,
  getWeeksOfMonth,
  formatDateBR,
} from '../utils/timeCalculations';
import { getTherapistDailyMetrics } from '../utils/complianceEngine';
import { getTherapistColorTheme, getWeekColorTheme } from '../utils/colorThemes';

interface TableViewProps {
  onEditShift: (shift: ShiftEntry) => void;
  onOpenNewShift: (prefill?: Partial<ShiftEntry>) => void;
  onOpenVacationModal: (therapistId?: string) => void;
  onOpenFixedScheduleModal?: () => void;
  onOpenTemporaryShiftModal?: (therapistId?: string, dateStr?: string) => void;
  onOpenAddCollaboratorModal?: () => void;
}

export const TableView: React.FC<TableViewProps> = ({
  onEditShift,
  onOpenNewShift,
  onOpenVacationModal,
  onOpenFixedScheduleModal,
  onOpenTemporaryShiftModal,
  onOpenAddCollaboratorModal,
}) => {
  const {
    shifts,
    therapists,
    units,
    absences,
    selectedDate,
    setSelectedDate,
    deleteShift,
    updateShift,
    addShift,
    openCoverageModal,
  } = useSchedule();

  // Mode: Semanal ou Mensal (ou Diário)
  const [viewMode, setViewMode] = useState<'semanal' | 'mensal' | 'diaria'>('semanal');

  // Set de fonoaudiólogos ocultados
  const [hiddenTherapistIds, setHiddenTherapistIds] = useState<Set<string>>(new Set());

  // Alternar visibilidade de um profissional específico
  const toggleHideTherapist = (id: string) => {
    setHiddenTherapistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleHideAll = () => {
    if (hiddenTherapistIds.size === therapists.length) {
      setHiddenTherapistIds(new Set());
    } else {
      setHiddenTherapistIds(new Set(therapists.map((t) => t.id)));
    }
  };

  // Dias da semana atual (Segunda a Sexta)
  const currentWeekDays = useMemo(() => {
    return getWeekDates(selectedDate, false); // Segunda a Sexta
  }, [selectedDate]);

  // Semanas do mês atual para visão mensal
  const currentMonthWeeks = useMemo(() => {
    return getWeeksOfMonth(selectedDate);
  }, [selectedDate]);

  // Navegação de semana
  const handlePrevWeek = () => setSelectedDate(shiftDate(selectedDate, -7));
  const handleNextWeek = () => setSelectedDate(shiftDate(selectedDate, 7));
  const handleCurrentWeek = () => setSelectedDate(new Date().toISOString().split('T')[0]);

  // Navegação de mês
  const handlePrevMonth = () => setSelectedDate(shiftMonth(selectedDate, -1));
  const handleNextMonth = () => setSelectedDate(shiftMonth(selectedDate, 1));

  // Navegação de dia
  const handlePrevDay = () => setSelectedDate(shiftDate(selectedDate, -1));
  const handleNextDay = () => setSelectedDate(shiftDate(selectedDate, 1));

  // Handler de edição direta inline (sem abrir modal)
  const handleFieldChange = (
    therapist: Therapist,
    dateStr: string,
    field:
      | 'morningStart'
      | 'morningEnd'
      | 'morningUnitId'
      | 'afternoonStart'
      | 'afternoonEnd'
      | 'afternoonUnitId'
      | 'nightStart'
      | 'nightEnd'
      | 'nightUnitId'
      | 'unitId',
    value: string
  ) => {
    const existingShift = shifts.find(
      (s) => s.therapistId === therapist.id && s.date === dateStr
    );

    if (existingShift) {
      updateShift(existingShift.id, { [field]: value });
    } else {
      // Cria a escala automaticamente ao digitar
      const defUnit = therapist.defaultUnitId || units[0]?.id || '';
      addShift({
        date: dateStr,
        therapistId: therapist.id,
        unitId: defUnit,
        morningStart: field === 'morningStart' ? value : '07:30',
        morningEnd: field === 'morningEnd' ? value : '11:30',
        morningUnitId: field === 'morningUnitId' ? value : defUnit,
        afternoonStart: field === 'afternoonStart' ? value : '13:00',
        afternoonEnd: field === 'afternoonEnd' ? value : '17:00',
        afternoonUnitId: field === 'afternoonUnitId' ? value : defUnit,
        nightStart: field === 'nightStart' ? value : '',
        nightEnd: field === 'nightEnd' ? value : '',
        nightUnitId: field === 'nightUnitId' ? value : '',
        isCoverage: false,
        isVacant: false,
      });
    }
  };

  // Renderizar linha editável de um dia para determinado profissional
  const renderDayRow = (therapist: Therapist, dateStr: string) => {
    const dayShifts = shifts.filter(
      (s) => s.therapistId === therapist.id && s.date === dateStr
    );
    const primaryShift = dayShifts[0];

    // Checar se está de férias nesta data
    const isOnVacation = absences.some(
      (a) =>
        a.therapistId === therapist.id &&
        dateStr >= a.startDate &&
        dateStr <= a.endDate
    );

    const isVacant = primaryShift?.isVacant || isOnVacation;
    const weekdayName = getWeekdayLabel(dateStr);
    const duration = primaryShift ? calculateShiftDuration(primaryShift) : null;
    const therapistColorTheme = getTherapistColorTheme(therapist.id, therapist.color);

    // Métricas diárias para descanso e limite
    const dailyMetrics = getTherapistDailyMetrics(therapist.id, dateStr, shifts);
    const prevDate = shiftDate(dateStr, -1);
    const prevMetrics = getTherapistDailyMetrics(therapist.id, prevDate, shifts);
    const restHours =
      prevMetrics.lastEnd && duration?.firstStart
        ? calculateInterjornadaRest(prevMetrics.lastEnd, duration.firstStart)
        : null;

    // Empresa padrão para fallback
    const defaultCompanyId = therapist.defaultUnitId || units[0]?.id || '';
    const morningCompanyId = primaryShift?.morningUnitId || primaryShift?.unitId || defaultCompanyId;
    const afternoonCompanyId = primaryShift?.afternoonUnitId || primaryShift?.unitId || defaultCompanyId;
    const nightCompanyId = primaryShift?.nightUnitId || primaryShift?.unitId || defaultCompanyId;

    return (
      <tr
        key={dateStr}
        className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors text-xs ${
          isVacant ? 'bg-amber-50/40' : ''
        }`}
      >
        {/* Dia da Semana ou Profissional com Avatar Colorido na visão Diária */}
        <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
          {viewMode === 'diaria' ? (
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${therapistColorTheme.avatarBg} ${therapistColorTheme.avatarText}`}
              >
                {therapist.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <span className="font-bold text-slate-900">{therapist.name}</span>
            </div>
          ) : (
            weekdayName
          )}
        </td>

        {/* Manhã: Horários Entrada/Saída + Empresa Diferente da Manhã */}
        <td className="py-1.5 px-2 bg-slate-50/50 border-r border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <input
                type="time"
                value={primaryShift?.morningStart || ''}
                onChange={(e) =>
                  handleFieldChange(therapist, dateStr, 'morningStart', e.target.value)
                }
                className="w-16 px-1 py-0.5 text-xs font-mono text-center rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                placeholder="07:30"
                title="Horário de Entrada da Manhã"
              />
              <span className="text-slate-400 font-mono">-</span>
              <input
                type="time"
                value={primaryShift?.morningEnd || ''}
                onChange={(e) =>
                  handleFieldChange(therapist, dateStr, 'morningEnd', e.target.value)
                }
                className="w-16 px-1 py-0.5 text-xs font-mono text-center rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                placeholder="11:30"
                title="Horário de Saída da Manhã"
              />
            </div>

            {/* Empresa do Turno da Manhã */}
            <select
              value={morningCompanyId}
              onChange={(e) =>
                handleFieldChange(therapist, dateStr, 'morningUnitId', e.target.value)
              }
              className="w-full text-[11px] rounded border border-slate-300 px-1 py-0.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600 truncate"
              title="Empresa atendida no turno da Manhã"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </td>

        {/* Tarde: Horários Entrada/Saída + Empresa Diferente da Tarde */}
        <td className="py-1.5 px-2 border-r border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <input
                type="time"
                value={primaryShift?.afternoonStart || ''}
                onChange={(e) =>
                  handleFieldChange(therapist, dateStr, 'afternoonStart', e.target.value)
                }
                className="w-16 px-1 py-0.5 text-xs font-mono text-center rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                placeholder="13:00"
                title="Horário de Entrada da Tarde"
              />
              <span className="text-slate-400 font-mono">-</span>
              <input
                type="time"
                value={primaryShift?.afternoonEnd || ''}
                onChange={(e) =>
                  handleFieldChange(therapist, dateStr, 'afternoonEnd', e.target.value)
                }
                className="w-16 px-1 py-0.5 text-xs font-mono text-center rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                placeholder="17:00"
                title="Horário de Saída da Tarde"
              />
            </div>

            {/* Empresa do Turno da Tarde */}
            <select
              value={afternoonCompanyId}
              onChange={(e) =>
                handleFieldChange(therapist, dateStr, 'afternoonUnitId', e.target.value)
              }
              className="w-full text-[11px] rounded border border-slate-300 px-1 py-0.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600 truncate"
              title="Empresa atendida no turno da Tarde"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </td>

        {/* Noite: Horários Entrada/Saída + Empresa Diferente da Noite */}
        <td className="py-1.5 px-2 bg-slate-50/50 border-r border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <input
                type="time"
                value={primaryShift?.nightStart || ''}
                onChange={(e) =>
                  handleFieldChange(therapist, dateStr, 'nightStart', e.target.value)
                }
                className="w-16 px-1 py-0.5 text-xs font-mono text-center rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                placeholder="--:--"
                title="Horário de Entrada da Noite"
              />
              <span className="text-slate-400 font-mono">-</span>
              <input
                type="time"
                value={primaryShift?.nightEnd || ''}
                onChange={(e) =>
                  handleFieldChange(therapist, dateStr, 'nightEnd', e.target.value)
                }
                className="w-16 px-1 py-0.5 text-xs font-mono text-center rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                placeholder="--:--"
                title="Horário de Saída da Noite"
              />
            </div>

            {/* Empresa do Turno da Noite */}
            <select
              value={nightCompanyId}
              onChange={(e) =>
                handleFieldChange(therapist, dateStr, 'nightUnitId', e.target.value)
              }
              className="w-full text-[11px] rounded border border-slate-300 px-1 py-0.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600 truncate"
              title="Empresa atendida no turno da Noite"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </td>

        {/* Carga Diária e Descanso 12h */}
        <td className="py-1.5 px-2 text-center whitespace-nowrap">
          {isVacant ? (
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold text-amber-800 text-[11px]">
                {isOnVacation ? 'Férias (Vago)' : 'Vaga Aberta'}
              </span>
              {primaryShift && (
                <button
                  type="button"
                  onClick={() => openCoverageModal(primaryShift)}
                  className="px-2 py-0.5 text-[10px] font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded whitespace-nowrap flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-2.5 h-2.5 text-teal-700" />
                  <span>Substituir</span>
                </button>
              )}
            </div>
          ) : duration && duration.totalMinutes > 0 ? (
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div className="flex items-center gap-1">
                <span
                  className={`font-mono font-bold ${
                    dailyMetrics.totalHours > 10
                      ? 'text-rose-700 bg-rose-50 px-1 rounded'
                      : 'text-slate-800'
                  }`}
                >
                  {formatMinutesToHours(duration.totalMinutes)}
                </span>
                {restHours !== null && (
                  <span
                    className={`text-[10px] font-mono ${
                      restHours < 12 ? 'text-rose-600 font-bold' : 'text-slate-500'
                    }`}
                    title={`Descanso interjornada: ${restHours}h`}
                  >
                    ({restHours}h)
                  </span>
                )}
              </div>
              {primaryShift?.isTemporary && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                  title={primaryShift.temporaryReason || 'Avulso'}
                >
                  <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                  <span>Avulso</span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-mono">—</span>
          )}
        </td>

        {/* Ações rápidas: Alocar Avulso e Limpar Dia */}
        <td className="py-1.5 px-2 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            {onOpenTemporaryShiftModal && (
              <button
                type="button"
                onClick={() => onOpenTemporaryShiftModal(therapist.id, dateStr)}
                className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors"
                title="Alocar profissional avulso nesta data"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            )}

            {primaryShift && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Limpar horários deste dia?')) {
                    deleteShift(primaryShift.id);
                  }
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Limpar horários"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Ícones para Semanal, Mensal e Diária + Navegação sem data poluindo */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* View Mode Toggle com Ícones */}
        <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs">
          {/* Semanal por Profissional */}
          <button
            onClick={() => setViewMode('semanal')}
            className={`px-3 py-1.5 font-semibold rounded transition-colors flex items-center gap-1.5 ${
              viewMode === 'semanal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visualização Semanal por Profissional"
          >
            <CalendarDays className="w-4 h-4 text-teal-700" />
            <span>Semanal por Profissional</span>
          </button>

          {/* Mensal por Profissional */}
          <button
            onClick={() => setViewMode('mensal')}
            className={`px-3 py-1.5 font-semibold rounded transition-colors flex items-center gap-1.5 ${
              viewMode === 'mensal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visualização Mensal por Profissional"
          >
            <Calendar className="w-4 h-4 text-indigo-700" />
            <span>Mensal por Profissional</span>
          </button>

          {/* Diária Geral */}
          <button
            onClick={() => setViewMode('diaria')}
            className={`px-3 py-1.5 font-semibold rounded transition-colors flex items-center gap-1.5 ${
              viewMode === 'diaria'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visualização Diária Geral"
          >
            <Sun className="w-4 h-4 text-slate-700" />
            <span>Diária Geral</span>
          </button>
        </div>

        {/* Navegação simples sem texto de data poluindo */}
        <div className="flex items-center gap-2">
          {viewMode === 'semanal' && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleCurrentWeek}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Semana Atual
              </button>
              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Próxima semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {viewMode === 'mensal' && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleCurrentWeek}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Mês Atual
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {viewMode === 'diaria' && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevDay}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Dia anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleCurrentWeek}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Hoje
              </button>
              <button
                onClick={handleNextDay}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Próximo dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Botão Global Ocultar/Mostrar Todos */}
          {(viewMode === 'semanal' || viewMode === 'mensal') && (
            <button
              onClick={toggleHideAll}
              className="ml-2 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200 flex items-center gap-1"
            >
              {hiddenTherapistIds.size === therapists.length ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Mostrar Todos</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ocultar Todos</span>
                </>
              )}
            </button>
          )}

          {onOpenAddCollaboratorModal && (
            <button
              onClick={onOpenAddCollaboratorModal}
              className="ml-2 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-300 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Cadastrar novo fonoaudiólogo no sistema com cor personalizada"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-700" />
              <span>Incluir Colaborador</span>
            </button>
          )}

          {onOpenFixedScheduleModal && (
            <button
              onClick={onOpenFixedScheduleModal}
              className="ml-2 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 flex items-center gap-1.5 transition-colors"
              title="Definir escala fixa por empresa"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Escala Fixa</span>
            </button>
          )}

          {onOpenTemporaryShiftModal && (
            <button
              onClick={() => onOpenTemporaryShiftModal()}
              className="ml-2 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded border border-amber-300 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Alocar profissional avulso"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Avulso</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. VISUALIZAÇÃO SEMANAL POR PROFISSIONAL COM EDIÇÃO DIRETA */}
      {viewMode === 'semanal' && (
        <div className="space-y-4">
          {therapists.map((therapist) => {
            const isHidden = hiddenTherapistIds.has(therapist.id);
            const colorTheme = getTherapistColorTheme(therapist.id, therapist.color);
            const initials = therapist.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            // Calcular horas da semana para este fonoaudiólogo
            const weekShifts = shifts.filter(
              (s) => s.therapistId === therapist.id && currentWeekDays.includes(s.date)
            );
            let weekMinutes = 0;
            weekShifts.forEach((s) => {
              weekMinutes += calculateShiftDuration(s).totalMinutes;
            });

            return (
              <div
                key={therapist.id}
                className={`bg-white rounded-lg border ${colorTheme.cardBorder} ${colorTheme.leftBorder} overflow-hidden shadow-xs transition-shadow hover:shadow-sm`}
              >
                {/* Header do Profissional com Avatar e Cor Exclusiva */}
                <div
                  className={`px-4 py-2.5 ${colorTheme.headerBg} border-b ${colorTheme.cardBorder} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar com a cor exclusiva do fonoaudiólogo */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${colorTheme.avatarBg} ${colorTheme.avatarText}`}
                      title={`Cor exclusiva: ${colorTheme.name}`}
                    >
                      {initials}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${colorTheme.headerText}`}>
                        {therapist.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colorTheme.badgeBg} ${colorTheme.badgeText} border ${colorTheme.badgeBorder}`}
                      >
                        {therapist.contractHoursPerWeek}h/sem
                      </span>
                    </div>

                    <span className="text-slate-400">·</span>
                    <span className="text-xs font-mono text-slate-700">
                      Total na Semana: <strong>{formatMinutesToHours(weekMinutes)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botão Marcar Férias */}
                    <button
                      onClick={() => onOpenVacationModal(therapist.id)}
                      className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors flex items-center gap-1"
                    >
                      <CalendarOff className="w-3 h-3" />
                      <span>Marcar Férias</span>
                    </button>

                    {/* Botão Ocultar */}
                    <button
                      onClick={() => toggleHideTherapist(therapist.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 ${
                        isHidden
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Mostrar</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ocultar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tabela do Profissional editável diretamente na tela */}
                {!isHidden && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-3 w-28">Dia</th>
                          <th className="py-2.5 px-2 text-center w-52 bg-slate-100">
                            Manhã
                          </th>
                          <th className="py-2.5 px-2 text-center w-52 bg-slate-100/50">
                            Tarde
                          </th>
                          <th className="py-2.5 px-2 text-center w-52 bg-slate-100">
                            Noite
                          </th>
                          <th className="py-2.5 px-2 text-center w-28">Carga Diária</th>
                          <th className="py-2.5 px-2 text-right w-16">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentWeekDays.map((dateStr) =>
                          renderDayRow(therapist, dateStr)
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. VISUALIZAÇÃO MENSAL POR PROFISSIONAL */}
      {viewMode === 'mensal' && (
        <div className="space-y-5">
          {therapists.map((therapist) => {
            const isHidden = hiddenTherapistIds.has(therapist.id);
            const colorTheme = getTherapistColorTheme(therapist.id, therapist.color);
            const initials = therapist.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={therapist.id}
                className={`bg-white rounded-lg border ${colorTheme.cardBorder} ${colorTheme.leftBorder} overflow-hidden shadow-xs transition-shadow hover:shadow-sm`}
              >
                {/* Header do Profissional com Avatar e Cor */}
                <div
                  className={`px-4 py-2.5 ${colorTheme.headerBg} border-b ${colorTheme.cardBorder} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${colorTheme.avatarBg} ${colorTheme.avatarText}`}
                      title={`Cor exclusiva: ${colorTheme.name}`}
                    >
                      {initials}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${colorTheme.headerText}`}>
                        {therapist.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colorTheme.badgeBg} ${colorTheme.badgeText} border ${colorTheme.badgeBorder}`}
                      >
                        {therapist.contractHoursPerWeek}h/sem
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenVacationModal(therapist.id)}
                      className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors flex items-center gap-1"
                    >
                      <CalendarOff className="w-3 h-3" />
                      <span>Marcar Férias</span>
                    </button>

                    <button
                      onClick={() => toggleHideTherapist(therapist.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 ${
                        isHidden
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Mostrar</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ocultar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Conteúdo Mensal por Semanas - CADA SEMANA COM UMA COR DIFERENTE */}
                {!isHidden && (
                  <div className="p-3 space-y-3">
                    {currentMonthWeeks.map((week) => {
                      const weekTheme = getWeekColorTheme(week.weekNumber);
                      const startDayLabel = formatDateBR(week.days[0]);
                      const endDayLabel = formatDateBR(week.days[week.days.length - 1]);

                      return (
                        <div
                          key={week.weekNumber}
                          className={`border ${weekTheme.containerBorder} ${weekTheme.accentBar} rounded-lg overflow-hidden bg-white shadow-2xs`}
                        >
                          {/* Banner com cor temática da semana do mês */}
                          <div
                            className={`${weekTheme.bannerBg} px-3 py-1.5 text-xs font-bold ${weekTheme.bannerText} border-b ${weekTheme.bannerBorder} flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${weekTheme.badgeBg}`}
                              >
                                Semana {week.weekNumber}
                              </span>
                              <span className="text-[11px] font-semibold opacity-85">
                                {startDayLabel} a {endDayLabel}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                              {weekTheme.name}
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr
                                  className={`border-b ${weekTheme.bannerBorder} ${weekTheme.subHeaderBg} ${weekTheme.bannerText} font-bold uppercase tracking-wider text-[10px]`}
                                >
                                  <th className="py-1.5 px-3 w-28">Dia</th>
                                  <th className="py-1.5 px-2 text-center w-52">Manhã</th>
                                  <th className="py-1.5 px-2 text-center w-52">Tarde</th>
                                  <th className="py-1.5 px-2 text-center w-52">Noite</th>
                                  <th className="py-1.5 px-2 text-center w-28">Carga</th>
                                  <th className="py-1.5 px-2 text-right w-16">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {week.days.map((dateStr) =>
                                  renderDayRow(therapist, dateStr)
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. VISUALIZAÇÃO DIÁRIA GERAL (editável diretamente) */}
      {viewMode === 'diaria' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 min-w-[160px]">Profissional</th>
                  <th className="py-2.5 px-2 text-center w-52">Manhã</th>
                  <th className="py-2.5 px-2 text-center w-52">Tarde</th>
                  <th className="py-2.5 px-2 text-center w-52">Noite</th>
                  <th className="py-2.5 px-2 text-center w-28">Carga</th>
                  <th className="py-2.5 px-2 text-right w-16">Ações</th>
                </tr>
              </thead>
              <tbody>
                {therapists.map((therapist) =>
                  renderDayRow(therapist, selectedDate)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
