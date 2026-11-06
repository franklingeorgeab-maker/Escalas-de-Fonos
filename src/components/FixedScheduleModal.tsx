import React, { useState } from 'react';
import {
  X,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  CalendarCheck,
  UserPlus,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { FixedSchedulePattern, Therapist } from '../types';
import { getWeekDates } from '../utils/timeCalculations';
import { getTherapistColorTheme } from '../utils/colorThemes';

interface FixedScheduleModalProps {
  onClose: () => void;
}

export const FixedScheduleModal: React.FC<FixedScheduleModalProps> = ({ onClose }) => {
  const {
    units,
    therapists,
    fixedPatterns,
    addFixedPattern,
    deleteFixedPattern,
    applyFixedPatternsToWeek,
    selectedDate,
  } = useSchedule();

  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [isApplying, setIsApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  // Form para inserir profissional na escala fixa da empresa
  const [therapistId, setTherapistId] = useState<string>(therapists[0]?.id || '');
  const [weekday, setWeekday] = useState<1 | 2 | 3 | 4 | 5>(1); // 1 = Segunda
  const [morningStart, setMorningStart] = useState('08:00');
  const [morningEnd, setMorningEnd] = useState('12:00');
  const [morningUnitId, setMorningUnitId] = useState<string>(selectedUnitId);
  const [afternoonStart, setAfternoonStart] = useState('13:00');
  const [afternoonEnd, setAfternoonEnd] = useState('17:00');
  const [afternoonUnitId, setAfternoonUnitId] = useState<string>(selectedUnitId);
  const [nightStart, setNightStart] = useState('');
  const [nightEnd, setNightEnd] = useState('');
  const [nightUnitId, setNightUnitId] = useState<string>(selectedUnitId);

  const therapistMap = new Map(therapists.map((t) => [t.id, t]));
  const currentUnit = units.find((u) => u.id === selectedUnitId);

  // Padrões fixos da unidade selecionada
  const unitPatterns = fixedPatterns.filter((fp) => fp.unitId === selectedUnitId);

  const weekdayNames: Record<number, string> = {
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
  };

  const handleAddFixedShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId || !therapistId) return;

    addFixedPattern({
      unitId: selectedUnitId,
      weekday,
      therapistId,
      morningStart,
      morningEnd,
      morningUnitId: morningUnitId || selectedUnitId,
      afternoonStart,
      afternoonEnd,
      afternoonUnitId: afternoonUnitId || selectedUnitId,
      nightStart,
      nightEnd,
      nightUnitId: nightUnitId || selectedUnitId,
    });

    setApplyFeedback('Profissional inserido na escala fixa com sucesso!');
    setTimeout(() => setApplyFeedback(null), 3000);
  };

  const handleApplyToCurrentWeek = () => {
    const weekDays = getWeekDates(selectedDate, false); // Segunda a Sexta
    applyFixedPatternsToWeek(weekDays);
    setApplyFeedback('Escala fixa aplicada com sucesso para os dias desta semana!');
    setTimeout(() => {
      setApplyFeedback(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-bold text-slate-900">
              Definir Escala Fixa por Empresa / Unidade
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Seletor de Empresa e Botão de Aplicação */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Selecione a Empresa / Unidade:
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full text-xs font-semibold rounded-md border border-slate-300 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:self-end">
              <button
                type="button"
                onClick={handleApplyToCurrentWeek}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                title="Gera automaticamente os horários desta semana baseado nas escalas fixas"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Aplicar Escala Fixa na Semana Atual</span>
              </button>
            </div>
          </div>

          {applyFeedback && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-md flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{applyFeedback}</span>
            </div>
          )}

          {/* Lista de Escalas Fixas Atuais da Empresa */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Escala Fixa Atual — {currentUnit?.name} ({unitPatterns.length} horários)
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Dia da Semana</th>
                    <th className="py-2.5 px-3">Profissional</th>
                    <th className="py-2.5 px-2 text-center bg-slate-100">Manhã</th>
                    <th className="py-2.5 px-2 text-center bg-slate-100/50">Tarde</th>
                    <th className="py-2.5 px-2 text-center bg-slate-100">Noite</th>
                    <th className="py-2.5 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {unitPatterns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                        Nenhuma escala fixa definida para esta empresa ainda. Use o formulário abaixo para inserir profissionais.
                      </td>
                    </tr>
                  ) : (
                    unitPatterns
                      .sort((a, b) => a.weekday - b.weekday)
                      .map((pattern) => {
                        const therapist = therapistMap.get(pattern.therapistId);
                        const colorTheme = therapist
                          ? getTherapistColorTheme(therapist.id, therapist.color)
                          : null;
                        const initials = therapist
                          ? therapist.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()
                          : '';

                        return (
                          <tr key={pattern.id} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {weekdayNames[pattern.weekday]}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {colorTheme && (
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${colorTheme.avatarBg} ${colorTheme.avatarText}`}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <span>{therapist?.name || 'Profissional'}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center font-mono">
                              {pattern.morningStart && pattern.morningEnd
                                ? `(${pattern.morningStart}, ${pattern.morningEnd})`
                                : '—'}
                            </td>
                            <td className="py-2 px-2 text-center font-mono">
                              {pattern.afternoonStart && pattern.afternoonEnd
                                ? `(${pattern.afternoonStart}, ${pattern.afternoonEnd})`
                                : '—'}
                            </td>
                            <td className="py-2 px-2 text-center font-mono">
                              {pattern.nightStart && pattern.nightEnd
                                ? `(${pattern.nightStart}, ${pattern.nightEnd})`
                                : '—'}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => deleteFixedPattern(pattern.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Remover da escala fixa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulário: Inserir Profissional na Escala Fixa desta Empresa */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-teal-700" />
              <span>Inserir Profissional na Escala Fixa de {currentUnit?.name}</span>
            </span>

            <form onSubmit={handleAddFixedShift} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Profissional
                  </label>
                  <select
                    value={therapistId}
                    onChange={(e) => setTherapistId(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    required
                  >
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Dia Fixo da Semana
                  </label>
                  <select
                    value={weekday}
                    onChange={(e) => setWeekday(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terça-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                  </select>
                </div>
              </div>

              {/* Horários e Empresas por Turno */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1.5">
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Manhã
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={morningStart}
                      onChange={(e) => setMorningStart(e.target.value)}
                      className="w-full text-xs font-mono p-1 rounded border border-slate-300 text-center"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={morningEnd}
                      onChange={(e) => setMorningEnd(e.target.value)}
                      className="w-full text-xs font-mono p-1 rounded border border-slate-300 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                      Empresa Manhã:
                    </label>
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

                <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1.5">
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Tarde
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={afternoonStart}
                      onChange={(e) => setAfternoonStart(e.target.value)}
                      className="w-full text-xs font-mono p-1 rounded border border-slate-300 text-center"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={afternoonEnd}
                      onChange={(e) => setAfternoonEnd(e.target.value)}
                      className="w-full text-xs font-mono p-1 rounded border border-slate-300 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                      Empresa Tarde:
                    </label>
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

                <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1.5">
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Noite
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={nightStart}
                      onChange={(e) => setNightStart(e.target.value)}
                      className="w-full text-xs font-mono p-1 rounded border border-slate-300 text-center"
                      placeholder="--:--"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={nightEnd}
                      onChange={(e) => setNightEnd(e.target.value)}
                      className="w-full text-xs font-mono p-1 rounded border border-slate-300 text-center"
                      placeholder="--:--"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                      Empresa Noite:
                    </label>
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
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir na Escala Fixa desta Empresa</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
