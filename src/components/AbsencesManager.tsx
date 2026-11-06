import React, { useState } from 'react';
import {
  CalendarOff,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Calendar,
  User,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { Absence, AbsenceType } from '../types';
import { formatDateBR, formatDayWithWeekday } from '../utils/timeCalculations';

export const AbsencesManager: React.FC = () => {
  const {
    absences,
    therapists,
    shifts,
    addAbsence,
    deleteAbsence,
    openCoverageModal,
  } = useSchedule();

  const [isNewAbsenceModalOpen, setIsNewAbsenceModalOpen] = useState(false);
  const [selectedTherapistId, setSelectedTherapistId] = useState(therapists[0]?.id || '');
  const [absenceType, setAbsenceType] = useState<AbsenceType>('ferias');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const therapistMap = new Map(therapists.map((t) => [t.id, t]));

  const handleCreateAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTherapistId || !startDate || !endDate) return;

    addAbsence({
      therapistId: selectedTherapistId,
      type: absenceType,
      startDate,
      endDate,
      reason: reason.trim() || 'Afastamento programado',
    });

    setIsNewAbsenceModalOpen(false);
    setReason('');
  };

  const getAbsenceTypeLabel = (type: AbsenceType) => {
    switch (type) {
      case 'ferias':
        return 'Férias';
      case 'licenca_saude':
        return 'Licença de Saúde';
      case 'atestado':
        return 'Atestado Médico';
      case 'capacitacao':
        return 'Capacitação / Treinamento';
      case 'folga_compensatoria':
        return 'Folga Compensatória';
      default:
        return 'Afastamento';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-indigo-600" />
            <span>Gestão de Ausências, Férias e Licenças de Saúde</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Ao cadastrar um afastamento, os horários do fonoaudiólogo são marcados automaticamente para substituição rápida, permitindo que vários colegas cubram os períodos vagos sem conflito de escalas.
          </p>
        </div>

        <button
          onClick={() => setIsNewAbsenceModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Afastamento / Férias</span>
        </button>
      </div>

      {/* List of Registered Absences */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Afastamentos Registrados ({absences.length})
          </h3>
          <span className="text-xs text-slate-500">
            Acompanhe a cobertura de horários para cada período
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {absences.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum afastamento ou férias registrado no momento.
            </div>
          ) : (
            absences.map((abs) => {
              const therapist = therapistMap.get(abs.therapistId);
              // Buscar escalas desse terapeuta no intervalo
              const affectedShifts = shifts.filter(
                (s) =>
                  s.therapistId === abs.therapistId &&
                  s.date >= abs.startDate &&
                  s.date <= abs.endDate
              );

              const vacantCount = affectedShifts.filter((s) => s.isVacant).length;
              const coveredCount = affectedShifts.filter((s) => s.isCoverage).length;

              return (
                <div key={abs.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: Professional & Details */}
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm text-slate-900">
                          {therapist?.name || 'Profissional'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {therapist?.crfa}
                        </span>
                        <span className="text-xs text-indigo-800 bg-indigo-50 font-semibold px-2 py-0.5 rounded">
                          {getAbsenceTypeLabel(abs.type)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatDateBR(abs.startDate)} até {formatDateBR(abs.endDate)}
                          </span>
                        </div>
                        <span>·</span>
                        <span className="text-slate-500">{abs.reason}</span>
                      </div>

                      {/* Coverage Status Bar */}
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <span className="font-medium text-slate-700">
                          Situação das Escalas:
                        </span>
                        {vacantCount > 0 ? (
                          <span className="text-amber-800 bg-amber-100 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            {vacantCount} turno(s) vago(s) precisando de substituto
                          </span>
                        ) : affectedShifts.length > 0 ? (
                          <span className="text-teal-800 bg-teal-100 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            Todos os horários cobertos
                          </span>
                        ) : (
                          <span className="text-slate-500">Sem escalas criadas no período</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-start">
                      <button
                        onClick={() => {
                          if (confirm('Deseja excluir o registro deste afastamento?')) {
                            deleteAbsence(abs.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Remover afastamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List of Affected Shifts for Quick Action */}
                  {affectedShifts.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Turnos no período ({affectedShifts.length} alocações):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {affectedShifts.map((s) => (
                          <div
                            key={s.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                              s.isVacant
                                ? 'border-amber-200 bg-amber-50/50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-800">
                                {formatDayWithWeekday(s.date)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {s.morningStart && `M: ${s.morningStart}-${s.morningEnd} `}
                                {s.afternoonStart && `T: ${s.afternoonStart}-${s.afternoonEnd} `}
                                {s.nightStart && `N: ${s.nightStart}-${s.nightEnd}`}
                              </div>
                            </div>

                            {s.isVacant ? (
                              <button
                                onClick={() => openCoverageModal(s)}
                                className="px-2 py-1 text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded flex items-center gap-1 transition-colors"
                                title="Buscar profissional disponível para cobrir este dia"
                              >
                                <Sparkles className="w-3 h-3 text-teal-700" />
                                <span>Cobrir</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">
                                Coberto
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Registrar Afastamento */}
      {isNewAbsenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">
                Registrar Férias, Licença ou Afastamento
              </h3>
              <button
                onClick={() => setIsNewAbsenceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAbsence} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Fonoaudiólogo(a)
                </label>
                <select
                  value={selectedTherapistId}
                  onChange={(e) => setSelectedTherapistId(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  required
                >
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.crfa})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tipo de Afastamento
                </label>
                <select
                  value={absenceType}
                  onChange={(e) => setAbsenceType(e.target.value as AbsenceType)}
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="ferias">Férias Programadas</option>
                  <option value="licenca_saude">Licença de Saúde</option>
                  <option value="atestado">Atestado Médico</option>
                  <option value="capacitacao">Capacitação / Congresso</option>
                  <option value="folga_compensatoria">Folga Compensatória</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Data Término
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Motivo / Observações
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Férias regulares de 15 dias, necessário cobertura Matriz e WEG..."
                  rows={3}
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAbsenceModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  Registrar e Abrir Vagas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
