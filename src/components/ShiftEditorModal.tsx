import React, { useState, useMemo } from 'react';
import {
  X,
  CalendarCheck,
  Building2,
  User,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Save,
  HelpCircle,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ShiftEntry, Therapist, WorkUnit } from '../types';
import {
  calculateShiftDuration,
  calculateInterjornadaRest,
  formatMinutesToHours,
  shiftDate,
  timeToMinutes,
} from '../utils/timeCalculations';
import { getTherapistDailyMetrics } from '../utils/complianceEngine';

interface ShiftEditorModalProps {
  initialShift?: ShiftEntry | null;
  onClose: () => void;
}

export const ShiftEditorModal: React.FC<ShiftEditorModalProps> = ({
  initialShift,
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

  const isEditing = Boolean(initialShift && initialShift.id);

  const [date, setDate] = useState(initialShift?.date || selectedDate);
  const [therapistId, setTherapistId] = useState(
    initialShift?.therapistId || therapists[0]?.id || ''
  );
  const [unitId, setUnitId] = useState(
    initialShift?.unitId || units[0]?.id || ''
  );

  const [morningStart, setMorningStart] = useState(initialShift?.morningStart || '08:00');
  const [morningEnd, setMorningEnd] = useState(initialShift?.morningEnd || '12:00');
  const [morningUnitId, setMorningUnitId] = useState(initialShift?.morningUnitId || initialShift?.unitId || unitId);

  const [afternoonStart, setAfternoonStart] = useState(initialShift?.afternoonStart || '13:00');
  const [afternoonEnd, setAfternoonEnd] = useState(initialShift?.afternoonEnd || '17:00');
  const [afternoonUnitId, setAfternoonUnitId] = useState(initialShift?.afternoonUnitId || initialShift?.unitId || unitId);

  const [nightStart, setNightStart] = useState(initialShift?.nightStart || '');
  const [nightEnd, setNightEnd] = useState(initialShift?.nightEnd || '');
  const [nightUnitId, setNightUnitId] = useState(initialShift?.nightUnitId || initialShift?.unitId || unitId);

  const [notes, setNotes] = useState(initialShift?.notes || '');
  const [isVacant, setIsVacant] = useState(initialShift?.isVacant || false);
  const [isTemporary, setIsTemporary] = useState(initialShift?.isTemporary || false);
  const [temporaryReason, setTemporaryReason] = useState(initialShift?.temporaryReason || '');

  // Validação em tempo real
  const liveShift: ShiftEntry = {
    id: initialShift?.id || 'live_test',
    date,
    therapistId: isVacant ? '' : therapistId,
    unitId: morningUnitId || unitId,
    morningStart,
    morningEnd,
    morningUnitId,
    afternoonStart,
    afternoonEnd,
    afternoonUnitId,
    nightStart,
    nightEnd,
    nightUnitId,
    isCoverage: initialShift?.isCoverage || false,
    isVacant,
    isTemporary,
    temporaryReason,
  };

  const duration = calculateShiftDuration(liveShift);
  const totalMinutes = duration.totalMinutes;
  const totalHours = +(totalMinutes / 60).toFixed(2);

  // Checar limite de 10 horas
  const isOver10h = totalHours > 10;
  const isWarningHours = totalHours > 8.5 && totalHours <= 10;

  // Checar descanso interjornada de 12 horas com o dia anterior
  const prevDate = shiftDate(date, -1);
  const prevMetrics = getTherapistDailyMetrics(therapistId, prevDate, shifts);
  const interjornadaPrev =
    prevMetrics.lastEnd && duration.firstStart
      ? calculateInterjornadaRest(prevMetrics.lastEnd, duration.firstStart)
      : null;
  const isInterjornadaViolated = interjornadaPrev !== null && interjornadaPrev < 12;

  // Checar se o fonoaudiólogo está em férias/licença
  const activeAbsence = absences.find(
    (a) => a.therapistId === therapistId && date >= a.startDate && date <= a.endDate
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && initialShift) {
      updateShift(initialShift.id, {
        date,
        therapistId: isVacant ? '' : therapistId,
        unitId: morningUnitId || unitId,
        morningStart,
        morningEnd,
        morningUnitId,
        afternoonStart,
        afternoonEnd,
        afternoonUnitId,
        nightStart,
        nightEnd,
        nightUnitId,
        notes,
        isVacant,
        isTemporary,
        temporaryReason: isTemporary ? (temporaryReason || 'Avulso') : undefined,
      });
    } else {
      addShift({
        date,
        therapistId: isVacant ? '' : therapistId,
        unitId: morningUnitId || unitId,
        morningStart,
        morningEnd,
        morningUnitId,
        afternoonStart,
        afternoonEnd,
        afternoonUnitId,
        nightStart,
        nightEnd,
        nightUnitId,
        notes,
        isCoverage: false,
        isVacant,
        isTemporary,
        temporaryReason: isTemporary ? (temporaryReason || 'Avulso') : undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-semibold text-slate-900">
              {isEditing ? 'Editar Alocação de Escala' : 'Nova Alocação de Escala'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Vacant toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Vaga Aberta / Pendente de Substituto
              </span>
              <span className="text-[11px] text-slate-500">
                Ative caso o horário esteja sem fonoaudiólogo definido e precise de cobertura.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isVacant}
              onChange={(e) => setIsVacant(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          {/* Temporary Shift toggle */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-900 block">
                  Avulso
                </span>
                <span className="text-[11px] text-amber-700">
                  Marque se for uma alocação pontual (mutirão, plantão extra, demanda sazonal).
                </span>
              </div>
              <input
                type="checkbox"
                checked={isTemporary}
                onChange={(e) => setIsTemporary(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
              />
            </div>
            {isTemporary && (
              <input
                type="text"
                value={temporaryReason}
                onChange={(e) => setTemporaryReason(e.target.value)}
                placeholder="Motivo (ex: Mutirão de Audiometria, Plantão Extra 1 dia)"
                className="w-full text-xs rounded border border-amber-300 p-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            )}
          </div>

          {/* Row 1: Date & Therapist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Data da Escala
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                required
              />
            </div>

            {!isVacant && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Fonoaudiólogo(a) Alocado(a)
                </label>
                <select
                  value={therapistId}
                  onChange={(e) => setTherapistId(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  required={!isVacant}
                >
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {activeAbsence && (
            <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Atenção: Este profissional está em{' '}
                <strong>{activeAbsence.type}</strong> ({activeAbsence.startDate} a{' '}
                {activeAbsence.endDate}).
              </span>
            </div>
          )}

          {/* Times section with individual company for each turno */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block">
              Horários e Empresas por Turno (Manhã, Tarde e Noite)
            </span>

            {/* Manhã */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Início Manhã
                  </label>
                  <input
                    type="time"
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Fim Manhã
                  </label>
                  <input
                    type="time"
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Empresa Atendida de Manhã
                </label>
                <select
                  value={morningUnitId}
                  onChange={(e) => setMorningUnitId(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-medium"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tarde */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Início Tarde
                  </label>
                  <input
                    type="time"
                    value={afternoonStart}
                    onChange={(e) => setAfternoonStart(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Fim Tarde
                  </label>
                  <input
                    type="time"
                    value={afternoonEnd}
                    onChange={(e) => setAfternoonEnd(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Empresa Atendida à Tarde
                </label>
                <select
                  value={afternoonUnitId}
                  onChange={(e) => setAfternoonUnitId(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-medium"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Noite / Extra */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Início Noite / Extra (opcional)
                  </label>
                  <input
                    type="time"
                    value={nightStart}
                    onChange={(e) => setNightStart(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Fim Noite / Extra
                  </label>
                  <input
                    type="time"
                    value={nightEnd}
                    onChange={(e) => setNightEnd(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Empresa Atendida à Noite
                </label>
                <select
                  value={nightUnitId}
                  onChange={(e) => setNightUnitId(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-200 p-1.5 bg-white text-slate-800 font-medium"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Live Legal Feedback Box */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Auditoria em Tempo Real da Escala
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* Daily total */}
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Total de Trabalho</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    isOver10h
                      ? 'text-rose-700'
                      : isWarningHours
                      ? 'text-amber-700'
                      : 'text-slate-900'
                  }`}
                >
                  {formatMinutesToHours(totalMinutes)}
                </span>
                <span className="text-[10px] text-slate-400 block">máx legal 10h</span>
              </div>

              {/* Intrajornada */}
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Intervalo Almoço</span>
                <span className="font-mono font-semibold text-sm text-slate-900">
                  {duration.intrajornadaMinutes} min
                </span>
                <span className="text-[10px] text-slate-400 block">mínimo 60 min</span>
              </div>

              {/* Interjornada */}
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Interjornada 12h</span>
                <span
                  className={`font-mono font-semibold text-sm ${
                    isInterjornadaViolated ? 'text-rose-700' : 'text-teal-700'
                  }`}
                >
                  {interjornadaPrev !== null ? `${interjornadaPrev}h` : 'Livre'}
                </span>
                <span className="text-[10px] text-slate-400 block">mínimo 12h</span>
              </div>
            </div>

            {/* Warnings display */}
            {isOver10h && (
              <div className="text-xs text-rose-700 font-medium flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Violação Legal: jornada ultrapassa o teto máximo de 10h diárias!</span>
              </div>
            )}

            {isInterjornadaViolated && (
              <div className="text-xs text-rose-700 font-medium flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Descanso interjornada inferior a 12h (apenas {interjornadaPrev}h desde o turno anterior).
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Observações / Justificativa
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Demanda extraordinária PCA, substituição autorizada..."
              className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alocação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
