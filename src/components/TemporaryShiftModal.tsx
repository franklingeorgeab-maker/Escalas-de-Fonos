import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Calendar,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ShiftEntry } from '../types';
import {
  calculateShiftDuration,
  calculateInterjornadaRest,
  formatMinutesToHours,
  shiftDate,
} from '../utils/timeCalculations';
import { getTherapistDailyMetrics } from '../utils/complianceEngine';

interface TemporaryShiftModalProps {
  initialTherapistId?: string;
  initialDate?: string;
  onClose: () => void;
}

const PRESET_REASONS = [
  'Mutirão de Audiometria',
  'Atividade Extra (1 dia)',
  'Demanda Variável Emergencial',
  'Exames Ocupacionais Periódicos',
  'Cobertura Pontual de 1 dia',
  'Campanha de Saúde Vocal',
];

export const TemporaryShiftModal: React.FC<TemporaryShiftModalProps> = ({
  initialTherapistId,
  initialDate,
  onClose,
}) => {
  const {
    therapists,
    units,
    shifts,
    absences,
    selectedDate,
    addShift,
    updateShift,
  } = useSchedule();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [date, setDate] = useState<string>(initialDate || selectedDate || todayStr);
  const [therapistId, setTherapistId] = useState<string>(
    initialTherapistId || therapists[0]?.id || ''
  );
  const [unitId, setUnitId] = useState<string>(units[0]?.id || '');
  const [morningUnitId, setMorningUnitId] = useState<string>(units[0]?.id || '');
  const [afternoonUnitId, setAfternoonUnitId] = useState<string>(units[0]?.id || '');
  const [nightUnitId, setNightUnitId] = useState<string>(units[0]?.id || '');
  const [reason, setReason] = useState<string>('Mutirão de Audiometria');
  const [notes, setNotes] = useState<string>('');

  // Horários dos turnos
  const [morningStart, setMorningStart] = useState<string>('07:30');
  const [morningEnd, setMorningEnd] = useState<string>('11:30');
  const [afternoonStart, setAfternoonStart] = useState<string>('12:30');
  const [afternoonEnd, setAfternoonEnd] = useState<string>('16:30');
  const [nightStart, setNightStart] = useState<string>('');
  const [nightEnd, setNightEnd] = useState<string>('');

  // Ativação rápida de turnos
  const [enableMorning, setEnableMorning] = useState<boolean>(true);
  const [enableAfternoon, setEnableAfternoon] = useState<boolean>(true);
  const [enableNight, setEnableNight] = useState<boolean>(false);

  // Escala simulada para validação em tempo real
  const liveShift: ShiftEntry = useMemo(
    () => ({
      id: 'temp_validation',
      date,
      therapistId,
      unitId,
      morningStart: enableMorning ? morningStart : '',
      morningEnd: enableMorning ? morningEnd : '',
      morningUnitId: enableMorning ? (morningUnitId || unitId) : undefined,
      afternoonStart: enableAfternoon ? afternoonStart : '',
      afternoonEnd: enableAfternoon ? afternoonEnd : '',
      afternoonUnitId: enableAfternoon ? (afternoonUnitId || unitId) : undefined,
      nightStart: enableNight ? nightStart : '',
      nightEnd: enableNight ? nightEnd : '',
      nightUnitId: enableNight ? (nightUnitId || unitId) : undefined,
      isCoverage: false,
      isTemporary: true,
      temporaryReason: reason,
      notes,
    }),
    [
      date,
      therapistId,
      unitId,
      morningUnitId,
      afternoonUnitId,
      nightUnitId,
      enableMorning,
      morningStart,
      morningEnd,
      enableAfternoon,
      afternoonStart,
      afternoonEnd,
      enableNight,
      nightStart,
      nightEnd,
      reason,
      notes,
    ]
  );

  const duration = useMemo(() => calculateShiftDuration(liveShift), [liveShift]);
  const totalHours = +(duration.totalMinutes / 60).toFixed(2);

  // Checagem de escala existente do profissional neste mesmo dia
  const existingShiftOnDay = useMemo(() => {
    return shifts.find((s) => s.therapistId === therapistId && s.date === date);
  }, [shifts, therapistId, date]);

  // Auditoria de Conformidade CLT
  // 1. Teto 10h diárias (Art. 59 CLT)
  const isOver10h = totalHours > 10;
  const isZeroHours = duration.totalMinutes === 0;

  // 2. Descanso interjornada de 12h com o dia anterior (Art. 66 CLT)
  const prevDate = shiftDate(date, -1);
  const prevMetrics = getTherapistDailyMetrics(therapistId, prevDate, shifts);
  const interjornadaPrev =
    prevMetrics.lastEnd && duration.firstStart
      ? calculateInterjornadaRest(prevMetrics.lastEnd, duration.firstStart)
      : null;
  const isInterjornadaPrevViolated = interjornadaPrev !== null && interjornadaPrev < 12;

  // 3. Descanso interjornada de 12h com o dia seguinte (Art. 66 CLT)
  const nextDate = shiftDate(date, 1);
  const nextMetrics = getTherapistDailyMetrics(therapistId, nextDate, shifts);
  const interjornadaNext =
    duration.lastEnd && nextMetrics.firstStart
      ? calculateInterjornadaRest(duration.lastEnd, nextMetrics.firstStart)
      : null;
  const isInterjornadaNextViolated = interjornadaNext !== null && interjornadaNext < 12;

  // 4. Checar férias ou licença
  const activeAbsence = absences.find(
    (a) => a.therapistId === therapistId && date >= a.startDate && date <= a.endDate
  );

  // Presets de horários rápidos
  const applyPreset = (type: 'dia_inteiro' | 'manha' | 'tarde' | 'mutirao' | 'plantao_extra') => {
    switch (type) {
      case 'dia_inteiro':
        setEnableMorning(true);
        setMorningStart('07:30');
        setMorningEnd('11:30');
        setEnableAfternoon(true);
        setAfternoonStart('12:30');
        setAfternoonEnd('16:30');
        setEnableNight(false);
        setNightStart('');
        setNightEnd('');
        break;
      case 'manha':
        setEnableMorning(true);
        setMorningStart('07:30');
        setMorningEnd('11:30');
        setEnableAfternoon(false);
        setEnableNight(false);
        break;
      case 'tarde':
        setEnableMorning(false);
        setEnableAfternoon(true);
        setAfternoonStart('12:30');
        setAfternoonEnd('16:30');
        setEnableNight(false);
        break;
      case 'mutirao':
        setEnableMorning(true);
        setMorningStart('07:00');
        setMorningEnd('12:00');
        setEnableAfternoon(true);
        setAfternoonStart('13:00');
        setAfternoonEnd('16:00');
        setEnableNight(false);
        break;
      case 'plantao_extra':
        setEnableMorning(false);
        setEnableAfternoon(true);
        setAfternoonStart('13:00');
        setAfternoonEnd('17:00');
        setEnableNight(true);
        setNightStart('17:30');
        setNightEnd('20:00');
        break;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (isZeroHours) {
      alert('Selecione pelo menos um turno com horário válido.');
      return;
    }

    if (isOver10h) {
      const confirmOver = confirm(
        'Atenção: A jornada de ' +
          totalHours +
          'h ultrapassa o limite de 10 horas diárias (CLT Art. 59). Deseja continuar mesmo assim?'
      );
      if (!confirmOver) return;
    }

    if (existingShiftOnDay) {
      // Atualiza a escala existente para ser a escala temporária deste dia
      updateShift(existingShiftOnDay.id, {
        unitId,
        morningStart: enableMorning ? morningStart : '',
        morningEnd: enableMorning ? morningEnd : '',
        morningUnitId: enableMorning ? (morningUnitId || unitId) : undefined,
        afternoonStart: enableAfternoon ? afternoonStart : '',
        afternoonEnd: enableAfternoon ? afternoonEnd : '',
        afternoonUnitId: enableAfternoon ? (afternoonUnitId || unitId) : undefined,
        nightStart: enableNight ? nightStart : '',
        nightEnd: enableNight ? nightEnd : '',
        nightUnitId: enableNight ? (nightUnitId || unitId) : undefined,
        isTemporary: true,
        temporaryReason: reason,
        notes: notes || `Avulso: ${reason}`,
        isVacant: false,
      });
    } else {
      // Cria uma nova alocação avulsa
      addShift({
        date,
        therapistId,
        unitId,
        morningStart: enableMorning ? morningStart : '',
        morningEnd: enableMorning ? morningEnd : '',
        morningUnitId: enableMorning ? (morningUnitId || unitId) : undefined,
        afternoonStart: enableAfternoon ? afternoonStart : '',
        afternoonEnd: enableAfternoon ? afternoonEnd : '',
        afternoonUnitId: enableAfternoon ? (afternoonUnitId || unitId) : undefined,
        nightStart: enableNight ? nightStart : '',
        nightEnd: enableNight ? nightEnd : '',
        nightUnitId: enableNight ? (nightUnitId || unitId) : undefined,
        isCoverage: false,
        isTemporary: true,
        temporaryReason: reason,
        notes: notes || `Avulso: ${reason}`,
        isVacant: false,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Avulso
              </h3>
              <p className="text-xs text-slate-600">
                Alocação avulsa para demandas variáveis, mutirões ou atividades extras.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Alerta de escala pré-existente no dia */}
          {existingShiftOnDay && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Este profissional já possui uma escala cadastrada neste dia.
                </p>
                <p className="text-[11px] text-amber-800">
                  Ao confirmar, os horários e a empresa serão substituídos por esta alocação avulsa.
                </p>
              </div>
            </div>
          )}

          {/* Alerta se estiver de férias */}
          {activeAbsence && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Atenção: Profissional em {activeAbsence.type} nesta data.
                </p>
                <p className="text-[11px] text-rose-800">
                  Período: {activeAbsence.startDate} a {activeAbsence.endDate} ({activeAbsence.reason}).
                </p>
              </div>
            </div>
          )}

          {/* Bloco 1: Profissional, Data e Empresa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Profissional (sem Dr/Dra) */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Profissional
              </label>
              <select
                value={therapistId}
                onChange={(e) => setTherapistId(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                required
              >
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data (1 dia) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">Data (1 dia)</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDate(todayStr)}
                    className="text-[10px] text-teal-700 hover:underline"
                  >
                    Hoje
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setDate(shiftDate(todayStr, 1))}
                    className="text-[10px] text-teal-700 hover:underline"
                  >
                    Amanhã
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                required
              />
            </div>

            {/* Empresa / Unidade */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Empresa / Unidade
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                required
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bloco 2: Motivo com Tags Rápidas */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5">
              Motivo (Avulso)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
                    reason === preset
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Mutirão de Audiometria, Plantão Extra, Demanda Variável..."
              className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              required
            />
          </div>

          {/* Bloco 3: Horários por Turno & Modelos Rápidos */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Definição dos Turnos
              </span>
              {/* Presets rápidos */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Modelos:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('dia_inteiro')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-semibold"
                >
                  Dia Inteiro (8h)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('manha')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-semibold"
                >
                  Manhã (4h)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('tarde')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-semibold"
                >
                  Tarde (4h)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('mutirao')}
                  className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-semibold"
                >
                  Mutirão (8h)
                </button>
              </div>
            </div>

            {/* Manhã */}
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                enableMorning
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-slate-100/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={enableMorning}
                    onChange={(e) => setEnableMorning(e.target.checked)}
                    className="w-3.5 h-3.5 text-teal-600 rounded"
                  />
                  <span>Turno da Manhã</span>
                </label>
                {enableMorning && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Entrada e Saída
                  </span>
                )}
              </div>
              {enableMorning && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 w-12 text-[11px]">Entrada:</span>
                      <input
                        type="time"
                        value={morningStart}
                        onChange={(e) => setMorningStart(e.target.value)}
                        className="w-full p-1 rounded border border-slate-300 bg-white font-mono text-center text-xs"
                        required={enableMorning}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 w-10 text-[11px]">Saída:</span>
                      <input
                        type="time"
                        value={morningEnd}
                        onChange={(e) => setMorningEnd(e.target.value)}
                        className="w-full p-1 rounded border border-slate-300 bg-white font-mono text-center text-xs"
                        required={enableMorning}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">Empresa Manhã:</span>
                    <select
                      value={morningUnitId}
                      onChange={(e) => setMorningUnitId(e.target.value)}
                      className="w-full text-[11px] rounded border border-slate-300 p-1 bg-white text-slate-700"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Tarde */}
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                enableAfternoon
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-slate-100/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={enableAfternoon}
                    onChange={(e) => setEnableAfternoon(e.target.checked)}
                    className="w-3.5 h-3.5 text-teal-600 rounded"
                  />
                  <span>Turno da Tarde</span>
                </label>
                {enableAfternoon && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Entrada e Saída
                  </span>
                )}
              </div>
              {enableAfternoon && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 w-12 text-[11px]">Entrada:</span>
                      <input
                        type="time"
                        value={afternoonStart}
                        onChange={(e) => setAfternoonStart(e.target.value)}
                        className="w-full p-1 rounded border border-slate-300 bg-white font-mono text-center text-xs"
                        required={enableAfternoon}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 w-10 text-[11px]">Saída:</span>
                      <input
                        type="time"
                        value={afternoonEnd}
                        onChange={(e) => setAfternoonEnd(e.target.value)}
                        className="w-full p-1 rounded border border-slate-300 bg-white font-mono text-center text-xs"
                        required={enableAfternoon}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">Empresa Tarde:</span>
                    <select
                      value={afternoonUnitId}
                      onChange={(e) => setAfternoonUnitId(e.target.value)}
                      className="w-full text-[11px] rounded border border-slate-300 p-1 bg-white text-slate-700"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Noite */}
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                enableNight
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-slate-100/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={enableNight}
                    onChange={(e) => setEnableNight(e.target.checked)}
                    className="w-3.5 h-3.5 text-teal-600 rounded"
                  />
                  <span>Turno da Noite / Extra</span>
                </label>
                {enableNight && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Entrada e Saída
                  </span>
                )}
              </div>
              {enableNight && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 w-12 text-[11px]">Entrada:</span>
                      <input
                        type="time"
                        value={nightStart}
                        onChange={(e) => setNightStart(e.target.value)}
                        className="w-full p-1 rounded border border-slate-300 bg-white font-mono text-center text-xs"
                        required={enableNight}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 w-10 text-[11px]">Saída:</span>
                      <input
                        type="time"
                        value={nightEnd}
                        onChange={(e) => setNightEnd(e.target.value)}
                        className="w-full p-1 rounded border border-slate-300 bg-white font-mono text-center text-xs"
                        required={enableNight}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">Empresa Noite:</span>
                    <select
                      value={nightUnitId}
                      onChange={(e) => setNightUnitId(e.target.value)}
                      className="w-full text-[11px] rounded border border-slate-300 p-1 bg-white text-slate-700"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bloco 4: Auditoria em Tempo Real de Horários e Intervalos Legais */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Auditoria de Horários e Descanso Legal
              </span>
              {!isOver10h && !isInterjornadaPrevViolated && !isInterjornadaNextViolated && !isZeroHours && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Conforme (CLT Art. 59 e Art. 66)
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Total Horas do Dia */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Jornada no Dia</span>
                <span
                  className={`text-sm font-mono font-bold block ${
                    isOver10h ? 'text-rose-700' : 'text-slate-900'
                  }`}
                >
                  {formatMinutesToHours(duration.totalMinutes)}
                </span>
                <span className="text-[10px] text-slate-400">máximo 10h</span>
              </div>

              {/* Descanso Dia Anterior */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Descanso Anterior</span>
                <span
                  className={`text-sm font-mono font-bold block ${
                    isInterjornadaPrevViolated ? 'text-rose-700' : 'text-teal-700'
                  }`}
                >
                  {interjornadaPrev !== null ? `${interjornadaPrev}h` : 'Livre'}
                </span>
                <span className="text-[10px] text-slate-400">mínimo 12h</span>
              </div>

              {/* Descanso Dia Seguinte */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Descanso Seguinte</span>
                <span
                  className={`text-sm font-mono font-bold block ${
                    isInterjornadaNextViolated ? 'text-rose-700' : 'text-teal-700'
                  }`}
                >
                  {interjornadaNext !== null ? `${interjornadaNext}h` : 'Livre'}
                </span>
                <span className="text-[10px] text-slate-400">mínimo 12h</span>
              </div>
            </div>

            {/* Mensagens de Alerta */}
            {isOver10h && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>
                  Atenção: A escala ultrapassa o teto legal de 10 horas diárias ({totalHours}h).
                </span>
              </div>
            )}

            {isInterjornadaPrevViolated && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>
                  Intervalo interjornada inferior a 12 horas desde o dia anterior ({interjornadaPrev}h).
                </span>
              </div>
            )}

            {isInterjornadaNextViolated && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>
                  Intervalo interjornada inferior a 12 horas até o dia seguinte ({interjornadaNext}h).
                </span>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Observações Adicionais (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Auditoria in-company com protetor auricular, calibração cabine..."
              className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          {/* Footer Botões */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Confirmar Avulso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
