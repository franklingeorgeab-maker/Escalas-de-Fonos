import React, { useState } from 'react';
import {
  CheckCircle2,
  UserPlus,
  Search,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { findAvailableCandidatesForSlot } from '../utils/complianceEngine';
import { CandidateAvailability } from '../types';
import { formatDateBR } from '../utils/timeCalculations';
import { getTherapistColorTheme } from '../utils/colorThemes';

interface QuickAvailabilityCheckerProps {
  onAllocated?: () => void;
}

export const QuickAvailabilityChecker: React.FC<QuickAvailabilityCheckerProps> = ({ onAllocated }) => {
  const {
    therapists,
    units,
    shifts,
    absences,
    selectedDate,
    setSelectedDate,
    addShift,
  } = useSchedule();

  // Inputs for checking availability
  const [checkDate, setCheckDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('12:00');
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');

  // Resultado sob demanda (NÃO automático)
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    date: string;
    start: string;
    end: string;
    candidates: CandidateAvailability[];
  } | null>(null);

  // Executa busca somente ao clicar no botão
  const handleSearch = () => {
    if (!checkDate || !startTime || !endTime) return;

    const [h] = startTime.split(':').map(Number);
    let evaluatedTimes: {
      morningStart?: string;
      morningEnd?: string;
      afternoonStart?: string;
      afternoonEnd?: string;
      nightStart?: string;
      nightEnd?: string;
    };

    if (h < 12) {
      evaluatedTimes = { morningStart: startTime, morningEnd: endTime };
    } else if (h < 18) {
      evaluatedTimes = { afternoonStart: startTime, afternoonEnd: endTime };
    } else {
      evaluatedTimes = { nightStart: startTime, nightEnd: endTime };
    }

    const allCandidates = findAvailableCandidatesForSlot(
      checkDate,
      evaluatedTimes,
      selectedUnitId,
      therapists,
      shifts,
      absences
    );

    // Filtrar apenas quem está disponível
    const availableOnly = allCandidates.filter((c) => c.isEligible);

    setSearchResults({
      date: checkDate,
      start: startTime,
      end: endTime,
      candidates: availableOnly,
    });
    setHasSearched(true);
  };

  // 1-Click allocate candidate into this time slot
  const handleQuickAllocate = (candidateTherapistId: string) => {
    if (!searchResults) return;

    const [h] = searchResults.start.split(':').map(Number);
    const isMorning = h < 12;
    const isAfternoon = h >= 12 && h < 18;
    const isNight = h >= 18;

    addShift({
      date: searchResults.date,
      therapistId: candidateTherapistId,
      unitId: selectedUnitId,
      morningStart: isMorning ? searchResults.start : '',
      morningEnd: isMorning ? searchResults.end : '',
      afternoonStart: isAfternoon ? searchResults.start : '',
      afternoonEnd: isAfternoon ? searchResults.end : '',
      nightStart: isNight ? searchResults.start : '',
      nightEnd: isNight ? searchResults.end : '',
      isCoverage: false,
      notes: 'Alocação por consulta de horário',
      isVacant: false,
    });

    // Sincroniza a data selecionada para visualizar a escala
    setSelectedDate(searchResults.date);
    if (onAllocated) onAllocated();

    // Reexecuta a busca para atualizar quem sobrou disponível
    handleSearch();
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs mb-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Consultar Disponibilidade por Horário
          </h3>
        </div>
      </div>

      {/* Query Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-3 items-end">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Data
          </label>
          <input
            type="date"
            value={checkDate}
            onChange={(e) => {
              setCheckDate(e.target.value);
              setHasSearched(false);
            }}
            className="w-full text-xs rounded-md border border-slate-300 p-2 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Horário Início
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              setHasSearched(false);
            }}
            className="w-full text-xs rounded-md border border-slate-300 p-2 bg-slate-50 text-slate-800 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Horário Fim
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              setHasSearched(false);
            }}
            className="w-full text-xs rounded-md border border-slate-300 p-2 bg-slate-50 text-slate-800 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Unidade / Empresa
          </label>
          <select
            value={selectedUnitId}
            onChange={(e) => {
              setSelectedUnitId(e.target.value);
              setHasSearched(false);
            }}
            className="w-full text-xs rounded-md border border-slate-300 p-2 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Botão para disparar busca (sem resultado automático) */}
        <div>
          <button
            type="button"
            onClick={handleSearch}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar Disponíveis</span>
          </button>
        </div>
      </div>

      {/* Query Results - Aparece SOMENTE após o clique em Buscar */}
      {hasSearched && searchResults && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              Disponíveis em {formatDateBR(searchResults.date)} ({searchResults.start} às {searchResults.end}):
            </span>
            <span className="text-xs text-teal-800 font-medium">
              {searchResults.candidates.length} profissional(is) livre(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {searchResults.candidates.map((cand) => {
              const colorTheme = getTherapistColorTheme(cand.therapist.id, cand.therapist.color);
              const initials = cand.therapist.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={cand.therapist.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 shadow-2xs ${colorTheme.badgeBg} ${colorTheme.badgeBorder}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${colorTheme.avatarBg} ${colorTheme.avatarText} shadow-2xs`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {cand.therapist.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                        Disponível · Carga projetada: <strong>{cand.newDailyHours}h</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickAllocate(cand.therapist.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors whitespace-nowrap flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Alocar</span>
                  </button>
                </div>
              );
            })}

            {searchResults.candidates.length === 0 && (
              <div className="col-span-full p-3 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
                Nenhum profissional disponível para este horário sem violar descanso de 12h ou teto de 10h.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
