import React, { useState } from 'react';
import { X, CalendarOff, Check } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { Therapist } from '../types';

interface VacationModalProps {
  therapistId?: string;
  onClose: () => void;
}

export const VacationModal: React.FC<VacationModalProps> = ({
  therapistId,
  onClose,
}) => {
  const { therapists, addAbsence, selectedDate } = useSchedule();

  const [selectedId, setSelectedId] = useState(
    therapistId || therapists[0]?.id || ''
  );
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('Férias');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !startDate || !endDate) return;

    addAbsence({
      therapistId: selectedId,
      type: 'ferias',
      startDate,
      endDate,
      reason: reason.trim() || 'Férias',
    });

    onClose();
  };

  const targetTherapist = therapists.find((t) => t.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Marcar Férias
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Profissional
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              required
            >
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
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
                className="w-full text-xs rounded-md border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-600 focus:outline-none"
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
                className="w-full text-xs rounded-md border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md text-xs text-indigo-900">
            <span className="font-semibold block mb-0.5">O que acontece ao confirmar:</span>
            Os horários de <strong>{targetTherapist?.name}</strong> neste período ficarão marcados com o botão <strong>"Alocar Substituto"</strong> na planilha para você alocar outra pessoa com 1 clique.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar Férias</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
