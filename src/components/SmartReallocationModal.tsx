import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Building2,
  Calendar,
  Check,
  ArrowRight,
  UserCheck,
  Users,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ShiftEntry, Therapist, CandidateAvailability } from '../types';
import {
  findAvailableCandidatesForSlot,
} from '../utils/complianceEngine';
import {
  calculateShiftDuration,
  formatDateBR,
  formatDayWithWeekday,
  formatMinutesToHours,
} from '../utils/timeCalculations';
import { getTherapistColorTheme } from '../utils/colorThemes';

interface SmartReallocationModalProps {
  shift: ShiftEntry;
  onClose: () => void;
}

export const SmartReallocationModal: React.FC<SmartReallocationModalProps> = ({
  shift,
  onClose,
}) => {
  const {
    therapists,
    units,
    shifts,
    absences,
    assignCoverage,
    addShift,
    updateShift,
    deleteShift,
  } = useSchedule();

  const unit = units.find((u) => u.id === shift.unitId);
  const currentTherapist = therapists.find((t) => t.id === shift.therapistId);
  const duration = calculateShiftDuration(shift);

  const hasMorning = Boolean(shift.morningStart && shift.morningEnd);
  const hasAfternoon = Boolean(shift.afternoonStart && shift.afternoonEnd);
  const hasNight = Boolean(shift.nightStart && shift.nightEnd);

  // Modo: Único profissional para tudo OU Várias pessoas por período distinto
  const [allocationType, setAllocationType] = useState<'integral' | 'multi'>('integral');

  // Seleção para modo integral (1 única pessoa para o dia todo)
  const [singleCandidateId, setSingleCandidateId] = useState<string>('');

  // Seleções para modo multi-pessoa (uma pessoa para cada período)
  const [morningCandidateId, setMorningCandidateId] = useState<string>('');
  const [afternoonCandidateId, setAfternoonCandidateId] = useState<string>('');
  const [nightCandidateId, setNightCandidateId] = useState<string>('');

  const [coverageReason, setCoverageReason] = useState<string>(
    shift.notes?.includes('férias')
      ? 'Cobertura de Férias'
      : 'Substituição de Horário'
  );

  // 1. Candidatos disponíveis para o dia todo
  const integralCandidates = useMemo(() => {
    const list = findAvailableCandidatesForSlot(
      shift.date,
      {
        morningStart: shift.morningStart,
        morningEnd: shift.morningEnd,
        afternoonStart: shift.afternoonStart,
        afternoonEnd: shift.afternoonEnd,
        nightStart: shift.nightStart,
        nightEnd: shift.nightEnd,
      },
      shift.unitId,
      therapists,
      shifts,
      absences,
      shift.therapistId
    );
    // Exibir apenas disponíveis
    return list.filter((c) => c.isEligible);
  }, [shift, therapists, shifts, absences]);

  // 2. Candidatos disponíveis apenas para a MANHÃ
  const morningCandidates = useMemo(() => {
    if (!hasMorning) return [];
    const list = findAvailableCandidatesForSlot(
      shift.date,
      { morningStart: shift.morningStart, morningEnd: shift.morningEnd },
      shift.unitId,
      therapists,
      shifts,
      absences,
      shift.therapistId
    );
    return list.filter((c) => c.isEligible);
  }, [shift, hasMorning, therapists, shifts, absences]);

  // 3. Candidatos disponíveis apenas para a TARDE
  const afternoonCandidates = useMemo(() => {
    if (!hasAfternoon) return [];
    const list = findAvailableCandidatesForSlot(
      shift.date,
      { afternoonStart: shift.afternoonStart, afternoonEnd: shift.afternoonEnd },
      shift.unitId,
      therapists,
      shifts,
      absences,
      shift.therapistId
    );
    return list.filter((c) => c.isEligible);
  }, [shift, hasAfternoon, therapists, shifts, absences]);

  // 4. Candidatos disponíveis apenas para a NOITE
  const nightCandidates = useMemo(() => {
    if (!hasNight) return [];
    const list = findAvailableCandidatesForSlot(
      shift.date,
      { nightStart: shift.nightStart, nightEnd: shift.nightEnd },
      shift.unitId,
      therapists,
      shifts,
      absences,
      shift.therapistId
    );
    return list.filter((c) => c.isEligible);
  }, [shift, hasNight, therapists, shifts, absences]);

  // Auto-selecionar os primeiros elegíveis se vazios
  React.useEffect(() => {
    if (integralCandidates.length > 0 && !singleCandidateId) {
      setSingleCandidateId(integralCandidates[0].therapist.id);
    }
    if (morningCandidates.length > 0 && !morningCandidateId) {
      setMorningCandidateId(morningCandidates[0].therapist.id);
    }
    if (afternoonCandidates.length > 0 && !afternoonCandidateId) {
      // Se houver mais de um, tenta colocar alguém diferente da manhã para ilustrar a divisão
      const diff = afternoonCandidates.find((c) => c.therapist.id !== morningCandidateId);
      setAfternoonCandidateId(diff ? diff.therapist.id : afternoonCandidates[0].therapist.id);
    }
    if (nightCandidates.length > 0 && !nightCandidateId) {
      setNightCandidateId(nightCandidates[0].therapist.id);
    }
  }, [integralCandidates, morningCandidates, afternoonCandidates, nightCandidates]);

  // Confirmar Substituição
  const handleConfirm = () => {
    if (allocationType === 'integral') {
      if (!singleCandidateId) return;
      assignCoverage(shift.id, singleCandidateId, coverageReason);
    } else {
      // Substituição dividida: uma pessoa de cada para períodos distintos
      // Remove a escala vago/antiga e cria as novas escalas divididas por turno
      deleteShift(shift.id);

      // Manhã
      if (hasMorning && morningCandidateId) {
        addShift({
          date: shift.date,
          therapistId: morningCandidateId,
          unitId: shift.unitId,
          morningStart: shift.morningStart,
          morningEnd: shift.morningEnd,
          afternoonStart: '',
          afternoonEnd: '',
          nightStart: '',
          nightEnd: '',
          isCoverage: true,
          coveringForTherapistId: shift.therapistId,
          coverageReason: `${coverageReason} (Manhã)`,
          notes: `Substituição Manhã`,
          isVacant: false,
        });
      }

      // Tarde
      if (hasAfternoon && afternoonCandidateId) {
        addShift({
          date: shift.date,
          therapistId: afternoonCandidateId,
          unitId: shift.unitId,
          morningStart: '',
          morningEnd: '',
          afternoonStart: shift.afternoonStart,
          afternoonEnd: shift.afternoonEnd,
          nightStart: '',
          nightEnd: '',
          isCoverage: true,
          coveringForTherapistId: shift.therapistId,
          coverageReason: `${coverageReason} (Tarde)`,
          notes: `Substituição Tarde`,
          isVacant: false,
        });
      }

      // Noite
      if (hasNight && nightCandidateId) {
        addShift({
          date: shift.date,
          therapistId: nightCandidateId,
          unitId: shift.unitId,
          morningStart: '',
          morningEnd: '',
          afternoonStart: '',
          afternoonEnd: '',
          nightStart: shift.nightStart,
          nightEnd: shift.nightEnd,
          isCoverage: true,
          coveringForTherapistId: shift.therapistId,
          coverageReason: `${coverageReason} (Noite)`,
          notes: `Substituição Noite`,
          isVacant: false,
        });
      }
    }

    onClose();
  };

  const cleanName = currentTherapist
    ? currentTherapist.name.replace(/^(Dr\.|Dra\.)\s*/i, '')
    : 'Vaga Aberta';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-bold text-slate-900">
              Alocar Substituto — {formatDayWithWeekday(shift.date)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Card Resumo do Horário */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Profissional a Substituir:
              </span>
              <span className="text-sm font-bold text-slate-900">{cleanName}</span>
              <span className="text-slate-500 block text-xs mt-0.5">
                Unidade: <strong>{unit?.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              {hasMorning && (
                <span className="bg-white px-2 py-1 rounded border border-slate-200">
                  M: ({shift.morningStart}, {shift.morningEnd})
                </span>
              )}
              {hasAfternoon && (
                <span className="bg-white px-2 py-1 rounded border border-slate-200">
                  T: ({shift.afternoonStart}, {shift.afternoonEnd})
                </span>
              )}
              {hasNight && (
                <span className="bg-white px-2 py-1 rounded border border-slate-200">
                  N: ({shift.nightStart}, {shift.nightEnd})
                </span>
              )}
            </div>
          </div>

          {/* Escolha do Tipo de Substituição: 1 pessoa para tudo OU várias em períodos distintos */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Formato da Substituição:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAllocationType('integral')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  allocationType === 'integral'
                    ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 font-semibold'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-slate-900 text-xs">
                  1 Pessoa para o Dia Inteiro
                </div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                  O mesmo profissional assume todos os turnos.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAllocationType('multi')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  allocationType === 'multi'
                    ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 font-semibold'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-slate-900 text-xs flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  <span>Várias Pessoas por Período</span>
                </div>
                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Uma pessoa diferente para cada período (manhã, tarde, noite).
                </div>
              </button>
            </div>
          </div>

          {/* Opção 1: INTEGRAL (1 pessoa para tudo) */}
          {allocationType === 'integral' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 block">
                Selecione o profissional disponível para o dia todo:
              </span>

              {integralCandidates.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs">
                  Nenhum profissional está disponível para cobrir o dia completo. Escolha a opção <strong>"Várias Pessoas por Período"</strong> para dividir a escala!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {integralCandidates.map((cand) => {
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
                        onClick={() => setSingleCandidateId(cand.therapist.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                          singleCandidateId === cand.therapist.id
                            ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${colorTheme.avatarBg} ${colorTheme.avatarText} shadow-2xs`}
                          >
                            {initials}
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            {cand.therapist.name}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs text-slate-600">
                            Jornada: <strong>{cand.newDailyHours}h</strong>
                          </span>
                        </div>

                        {singleCandidateId === cand.therapist.id && (
                          <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Opção 2: MULTI (Várias pessoas por período distinto) */}
          {allocationType === 'multi' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 block">
                Escolha quem cobrirá cada período individualmente:
              </span>

              {/* Período 1: Manhã */}
              {hasMorning && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Turno Manhã ({shift.morningStart} às {shift.morningEnd})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {morningCandidates.length} disponível(is)
                    </span>
                  </div>

                  <select
                    value={morningCandidateId}
                    onChange={(e) => setMorningCandidateId(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="">-- Selecione o substituto da manhã --</option>
                    {morningCandidates.map((c) => (
                      <option key={c.therapist.id} value={c.therapist.id}>
                        {c.therapist.name} (Jornada ficará em {c.newDailyHours}h)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Período 2: Tarde */}
              {hasAfternoon && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Turno Tarde ({shift.afternoonStart} às {shift.afternoonEnd})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {afternoonCandidates.length} disponível(is)
                    </span>
                  </div>

                  <select
                    value={afternoonCandidateId}
                    onChange={(e) => setAfternoonCandidateId(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="">-- Selecione o substituto da tarde --</option>
                    {afternoonCandidates.map((c) => (
                      <option key={c.therapist.id} value={c.therapist.id}>
                        {c.therapist.name} (Jornada ficará em {c.newDailyHours}h)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Período 3: Noite */}
              {hasNight && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Turno Noite ({shift.nightStart} às {shift.nightEnd})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {nightCandidates.length} disponível(is)
                    </span>
                  </div>

                  <select
                    value={nightCandidateId}
                    onChange={(e) => setNightCandidateId(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="">-- Selecione o substituto da noite --</option>
                    {nightCandidates.map((c) => (
                      <option key={c.therapist.id} value={c.therapist.id}>
                        {c.therapist.name} (Jornada ficará em {c.newDailyHours}h)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded shadow-xs flex items-center gap-1.5"
          >
            <span>Confirmar Substituição</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
