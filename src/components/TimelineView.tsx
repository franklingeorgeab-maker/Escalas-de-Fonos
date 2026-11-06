import React, { useState } from 'react';
import {
  Clock,
  Building2,
  AlertTriangle,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ShiftEntry, Therapist } from '../types';
import {
  timeToMinutes,
  minutesToTime,
  formatMinutesToHours,
  formatDayWithWeekday,
  calculateShiftDuration,
} from '../utils/timeCalculations';

interface TimelineViewProps {
  onEditShift: (shift: ShiftEntry) => void;
}

const TIMELINE_START_HOUR = 7; // 07:00
const TIMELINE_END_HOUR = 21;  // 21:00
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR; // 14 hours

export const TimelineView: React.FC<TimelineViewProps> = ({ onEditShift }) => {
  const {
    shifts,
    therapists,
    units,
    selectedDate,
    selectedUnitFilter,
    selectedTherapistFilter,
    openCoverageModal,
  } = useSchedule();

  const [viewGrouping, setViewGrouping] = useState<'therapist' | 'unit'>('therapist');

  const unitMap = new Map(units.map((u) => [u.id, u]));

  // Horas para os marcadores do topo (07h, 08h, ... 21h)
  const hoursList = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => TIMELINE_START_HOUR + i);

  // Helper para converter minutos para % horizontal na timeline
  const getPercentOffset = (timeStr?: string): number | null => {
    const min = timeToMinutes(timeStr);
    if (min === null) return null;
    const timelineStartMin = TIMELINE_START_HOUR * 60;
    const timelineTotalMin = TOTAL_HOURS * 60;
    const offset = ((min - timelineStartMin) / timelineTotalMin) * 100;
    return Math.max(0, Math.min(100, offset));
  };

  const getPercentWidth = (startStr?: string, endStr?: string): number => {
    const startOffset = getPercentOffset(startStr);
    const endOffset = getPercentOffset(endStr);
    if (startOffset === null || endOffset === null || endOffset <= startOffset) return 0;
    return endOffset - startOffset;
  };

  // Filtrar escalas da data selecionada
  const dayShifts = shifts.filter((s) => s.date === selectedDate);

  // Lista de terapeutas a exibir
  const displayedTherapists = therapists.filter((t) => {
    if (!t.active) return false;
    if (selectedTherapistFilter !== 'all' && t.id !== selectedTherapistFilter) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header Controls */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Grade Visual de Horários — {formatDayWithWeekday(selectedDate)}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Linha do tempo contínua das 07:00 às 21:00 mostrando turnos da manhã, tarde, noite e pausas intrajornada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setViewGrouping('therapist')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                viewGrouping === 'therapist'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão por Profissional
            </button>
            <button
              onClick={() => setViewGrouping('unit')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                viewGrouping === 'unit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão por Unidade / Empresa
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Grid Container */}
      <div className="p-6 overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Header Hour Markers */}
          <div className="grid grid-cols-[220px_1fr] border-b border-slate-200 pb-2 mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {viewGrouping === 'therapist' ? 'Fonoaudiólogo(a)' : 'Unidade / Consultório'}
            </div>
            <div className="relative h-6 text-xs text-slate-400 font-mono flex justify-between px-1">
              {hoursList.map((h) => (
                <div key={h} className="relative">
                  <span className="-translate-x-1/2 block">
                    {h.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows by Therapist */}
          {viewGrouping === 'therapist' ? (
            <div className="space-y-4">
              {displayedTherapists.map((therapist) => {
                const therapistShifts = dayShifts.filter((s) => s.therapistId === therapist.id);
                let totalMinutesToday = 0;
                therapistShifts.forEach((s) => {
                  totalMinutesToday += calculateShiftDuration(s).totalMinutes;
                });

                return (
                  <div
                    key={therapist.id}
                    className="grid grid-cols-[220px_1fr] items-center gap-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 transition-colors"
                  >
                    {/* Therapist Info Column */}
                    <div className="pr-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: therapist.color }}
                        />
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {therapist.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {therapist.crfa} ·{' '}
                        <strong
                          className={
                            totalMinutesToday > 600
                              ? 'text-rose-700 font-bold'
                              : totalMinutesToday > 510
                              ? 'text-amber-700 font-bold'
                              : 'text-slate-700'
                          }
                        >
                          {formatMinutesToHours(totalMinutesToday)} hoje
                        </strong>
                      </div>
                    </div>

                    {/* Timeline Bar Track */}
                    <div className="relative h-11 bg-slate-100/70 rounded-lg overflow-hidden border border-slate-200">
                      {/* Vertical hour guidelines */}
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-40">
                        {hoursList.map((h) => (
                          <div
                            key={h}
                            className="h-full border-r border-dashed border-slate-300"
                          />
                        ))}
                      </div>

                      {/* Render Shift Blocks */}
                      {therapistShifts.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 italic">
                          Sem alocações nesta data (Disponível)
                        </div>
                      ) : (
                        therapistShifts.map((shift) => {
                          const unit = unitMap.get(shift.unitId);

                          // Bloco Manhã
                          const mStart = getPercentOffset(shift.morningStart);
                          const mWidth = getPercentWidth(shift.morningStart, shift.morningEnd);

                          // Bloco Tarde
                          const aStart = getPercentOffset(shift.afternoonStart);
                          const aWidth = getPercentWidth(shift.afternoonStart, shift.afternoonEnd);

                          // Bloco Noite
                          const nStart = getPercentOffset(shift.nightStart);
                          const nWidth = getPercentWidth(shift.nightStart, shift.nightEnd);

                          return (
                            <React.Fragment key={shift.id}>
                              {/* Manhã */}
                              {mStart !== null && mWidth > 0 && (
                                <div
                                  onClick={() => onEditShift(shift)}
                                  style={{
                                    left: `${mStart}%`,
                                    width: `${mWidth}%`,
                                    backgroundColor: shift.isVacant
                                      ? '#fef3c7'
                                      : shift.isCoverage
                                      ? '#ccfbf1'
                                      : therapist.color + '22',
                                    borderColor: shift.isVacant
                                      ? '#f59e0b'
                                      : shift.isCoverage
                                      ? '#0d9488'
                                      : therapist.color,
                                  }}
                                  className="absolute top-1 bottom-1 rounded border shadow-xs px-2 flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.01] hover:z-10 overflow-hidden"
                                  title={`Manhã: ${shift.morningStart} - ${shift.morningEnd} (${unit?.name})`}
                                >
                                  <div className="text-[10px] font-bold text-slate-800 truncate flex items-center gap-1">
                                    <span>Manhã</span>
                                    <span className="font-mono text-slate-600 font-normal">
                                      {shift.morningStart}-{shift.morningEnd}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-600 truncate">
                                    {unit?.name}
                                  </div>
                                </div>
                              )}

                              {/* Tarde */}
                              {aStart !== null && aWidth > 0 && (
                                <div
                                  onClick={() => onEditShift(shift)}
                                  style={{
                                    left: `${aStart}%`,
                                    width: `${aWidth}%`,
                                    backgroundColor: shift.isVacant
                                      ? '#fef3c7'
                                      : shift.isCoverage
                                      ? '#ccfbf1'
                                      : therapist.color + '22',
                                    borderColor: shift.isVacant
                                      ? '#f59e0b'
                                      : shift.isCoverage
                                      ? '#0d9488'
                                      : therapist.color,
                                  }}
                                  className="absolute top-1 bottom-1 rounded border shadow-xs px-2 flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.01] hover:z-10 overflow-hidden"
                                  title={`Tarde: ${shift.afternoonStart} - ${shift.afternoonEnd} (${unit?.name})`}
                                >
                                  <div className="text-[10px] font-bold text-slate-800 truncate flex items-center gap-1">
                                    <span>Tarde</span>
                                    <span className="font-mono text-slate-600 font-normal">
                                      {shift.afternoonStart}-{shift.afternoonEnd}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-600 truncate">
                                    {unit?.name}
                                  </div>
                                </div>
                              )}

                              {/* Noite */}
                              {nStart !== null && nWidth > 0 && (
                                <div
                                  onClick={() => onEditShift(shift)}
                                  style={{
                                    left: `${nStart}%`,
                                    width: `${nWidth}%`,
                                    backgroundColor: shift.isVacant
                                      ? '#fef3c7'
                                      : shift.isCoverage
                                      ? '#ccfbf1'
                                      : therapist.color + '22',
                                    borderColor: shift.isVacant
                                      ? '#f59e0b'
                                      : shift.isCoverage
                                      ? '#0d9488'
                                      : therapist.color,
                                  }}
                                  className="absolute top-1 bottom-1 rounded border shadow-xs px-2 flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.01] hover:z-10 overflow-hidden"
                                  title={`Noite: ${shift.nightStart} - ${shift.nightEnd} (${unit?.name})`}
                                >
                                  <div className="text-[10px] font-bold text-slate-800 truncate flex items-center gap-1">
                                    <span>Noite</span>
                                    <span className="font-mono text-slate-600 font-normal">
                                      {shift.nightStart}-{shift.nightEnd}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-600 truncate">
                                    {unit?.name}
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Rows by Unit */
            <div className="space-y-4">
              {units.map((unit) => {
                const unitShifts = dayShifts.filter((s) => s.unitId === unit.id);

                return (
                  <div
                    key={unit.id}
                    className="grid grid-cols-[220px_1fr] items-center gap-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 transition-colors"
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{unit.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {unit.city} · {unitShifts.length} turno(s)
                      </div>
                    </div>

                    <div className="relative h-11 bg-slate-100/70 rounded-lg overflow-hidden border border-slate-200">
                      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-40">
                        {hoursList.map((h) => (
                          <div
                            key={h}
                            className="h-full border-r border-dashed border-slate-300"
                          />
                        ))}
                      </div>

                      {unitShifts.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 italic">
                          Consultório livre nesta data
                        </div>
                      ) : (
                        unitShifts.map((shift) => {
                          const therapist = therapists.find((t) => t.id === shift.therapistId);

                          const mStart = getPercentOffset(shift.morningStart);
                          const mWidth = getPercentWidth(shift.morningStart, shift.morningEnd);
                          const aStart = getPercentOffset(shift.afternoonStart);
                          const aWidth = getPercentWidth(shift.afternoonStart, shift.afternoonEnd);
                          const nStart = getPercentOffset(shift.nightStart);
                          const nWidth = getPercentWidth(shift.nightStart, shift.nightEnd);

                          return (
                            <React.Fragment key={shift.id}>
                              {mStart !== null && mWidth > 0 && (
                                <div
                                  onClick={() => onEditShift(shift)}
                                  style={{
                                    left: `${mStart}%`,
                                    width: `${mWidth}%`,
                                    backgroundColor: shift.isVacant ? '#fef3c7' : '#e0f2fe',
                                    borderColor: shift.isVacant ? '#f59e0b' : '#0284c7',
                                  }}
                                  className="absolute top-1 bottom-1 rounded border shadow-xs px-2 flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.01] hover:z-10 overflow-hidden"
                                  title={`${therapist?.name || 'Vaga Aberta'}: ${shift.morningStart}-${shift.morningEnd}`}
                                >
                                  <div className="text-[10px] font-bold text-slate-800 truncate">
                                    {therapist ? therapist.name : 'Vaga Descoberta'}
                                  </div>
                                  <div className="text-[9px] text-slate-600 font-mono">
                                    {shift.morningStart}-{shift.morningEnd}
                                  </div>
                                </div>
                              )}

                              {aStart !== null && aWidth > 0 && (
                                <div
                                  onClick={() => onEditShift(shift)}
                                  style={{
                                    left: `${aStart}%`,
                                    width: `${aWidth}%`,
                                    backgroundColor: shift.isVacant ? '#fef3c7' : '#e0f2fe',
                                    borderColor: shift.isVacant ? '#f59e0b' : '#0284c7',
                                  }}
                                  className="absolute top-1 bottom-1 rounded border shadow-xs px-2 flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.01] hover:z-10 overflow-hidden"
                                  title={`${therapist?.name || 'Vaga Aberta'}: ${shift.afternoonStart}-${shift.afternoonEnd}`}
                                >
                                  <div className="text-[10px] font-bold text-slate-800 truncate">
                                    {therapist ? therapist.name : 'Vaga Descoberta'}
                                  </div>
                                  <div className="text-[9px] text-slate-600 font-mono">
                                    {shift.afternoonStart}-{shift.afternoonEnd}
                                  </div>
                                </div>
                              )}

                              {nStart !== null && nWidth > 0 && (
                                <div
                                  onClick={() => onEditShift(shift)}
                                  style={{
                                    left: `${nStart}%`,
                                    width: `${nWidth}%`,
                                    backgroundColor: shift.isVacant ? '#fef3c7' : '#e0f2fe',
                                    borderColor: shift.isVacant ? '#f59e0b' : '#0284c7',
                                  }}
                                  className="absolute top-1 bottom-1 rounded border shadow-xs px-2 flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.01] hover:z-10 overflow-hidden"
                                  title={`${therapist?.name || 'Vaga Aberta'}: ${shift.nightStart}-${shift.nightEnd}`}
                                >
                                  <div className="text-[10px] font-bold text-slate-800 truncate">
                                    {therapist ? therapist.name : 'Vaga Descoberta'}
                                  </div>
                                  <div className="text-[9px] text-slate-600 font-mono">
                                    {shift.nightStart}-{shift.nightEnd}
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
