import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle,
  FileText,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { formatDateBR, formatDayWithWeekday } from '../utils/timeCalculations';

export const ComplianceAuditor: React.FC = () => {
  const { violations, shifts, openCoverageModal, setSelectedDate } = useSchedule();

  const severeErrors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');

  // Quebrar por tipo de regra
  const over10hViolations = violations.filter((v) => v.rule === 'MAX_10_HOURS');
  const interjornadaViolations = violations.filter((v) => v.rule === 'MIN_12_HOURS_INTERJORNADA');
  const overlapViolations = violations.filter((v) => v.rule === 'TIME_OVERLAP');
  const absenceViolations = violations.filter((v) => v.rule === 'ABSENCE_COLLISION');

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  severeErrors.length === 0
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {severeErrors.length === 0 ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                Auditoria de Conformidade Trabalhista e Escalas
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Monitoramento automatizado das Regras de Ouro: teto de 10 horas diárias (CLT Art. 59), descanso interjornada obrigatório de 12 horas consecutivas entre jornadas (CLT Art. 66), intervalo intrajornada e prevenção de conflitos de agenda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Status Geral</div>
              <div
                className={`text-sm font-bold ${
                  severeErrors.length === 0 ? 'text-teal-700' : 'text-rose-700'
                }`}
              >
                {severeErrors.length === 0
                  ? 'Escala 100% Conforme'
                  : `${severeErrors.length} Infração(ões) Crítica(s)`}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Rule Pillars Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Pillar 1: 10h Máximas */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Teto de 10 Horas Diárias</span>
              <span className="font-mono text-[11px] text-slate-400">CLT Art. 59</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-xl font-bold tabular-nums ${
                  over10hViolations.some((v) => v.severity === 'error')
                    ? 'text-rose-700'
                    : 'text-slate-900'
                }`}
              >
                {over10hViolations.filter((v) => v.severity === 'error').length}
              </span>
              <span className="text-xs text-slate-500">
                {over10hViolations.some((v) => v.severity === 'error')
                  ? 'violação(ões)'
                  : 'em conformidade'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Jornada máxima de trabalho permitida no dia incluindo horas extras.
            </p>
          </div>

          {/* Pillar 2: 12h Interjornada */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Intervalo Interjornada 12h</span>
              <span className="font-mono text-[11px] text-slate-400">CLT Art. 66</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-xl font-bold tabular-nums ${
                  interjornadaViolations.length > 0 ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {interjornadaViolations.length}
              </span>
              <span className="text-xs text-slate-500">
                {interjornadaViolations.length > 0 ? 'violação(ões)' : 'em conformidade'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Mínimo de 12 horas ininterruptas de descanso entre o fim de um dia e o início do próximo.
            </p>
          </div>

          {/* Pillar 3: Sobreposições */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Conflitos de Sobreposição</span>
              <span className="font-mono text-[11px] text-slate-400">Agenda</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-xl font-bold tabular-nums ${
                  overlapViolations.length > 0 ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {overlapViolations.length}
              </span>
              <span className="text-xs text-slate-500">
                {overlapViolations.length > 0 ? 'conflito(s)' : 'em conformidade'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Garante que nenhum fono esteja alocado em dois locais simultaneamente.
            </p>
          </div>

          {/* Pillar 4: Ausências / Férias */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Alocação em Afastamento</span>
              <span className="font-mono text-[11px] text-slate-400">Férias/Licenças</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-xl font-bold tabular-nums ${
                  absenceViolations.length > 0 ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {absenceViolations.length}
              </span>
              <span className="text-xs text-slate-500">
                {absenceViolations.length > 0 ? 'conflito(s)' : 'em conformidade'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Evita que profissionais em férias ou atestado médico constem como ativos.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Violation Log */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Ocorrências e Diagnósticos ({violations.length})
          </h3>
          <span className="text-xs text-slate-500">
            Clique em "Ajustar / Substituir" para resolver com um profissional disponível
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {violations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-teal-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-900">
                Nenhuma infração ou inconformidade detectada!
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todas as escalas cadastradas respeitam rigorosamente o teto de 10 horas diárias, o descanso interjornada mínimo de 12 horas e não possuem sobreposições ou conflitos de férias.
              </p>
            </div>
          ) : (
            violations.map((violation) => {
              const isError = violation.severity === 'error';
              const relatedShift = shifts.find(
                (s) =>
                  s.therapistId === violation.therapistId && s.date === violation.date
              );

              return (
                <div
                  key={violation.id}
                  className="p-5 hover:bg-slate-50/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                          isError
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {isError ? 'Infração Legal' : 'Alerta de Jornada'}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {violation.therapistName}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatDayWithWeekday(violation.date)} ({formatDateBR(violation.date)})
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-slate-800">
                      {violation.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {violation.description}
                    </p>

                    <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2 mt-2">
                      <span className="font-semibold text-teal-800 shrink-0">
                        Recomendação Técnica:
                      </span>
                      <span>{violation.recommendation}</span>
                    </div>
                  </div>

                  {/* Actions for this violation */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    {relatedShift && (
                      <button
                        onClick={() => openCoverageModal(relatedShift)}
                        className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                        <span>Substituir com Fono Disponível</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedDate(violation.date)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium underline underline-offset-2"
                    >
                      Ver na Planilha ({formatDateBR(violation.date)})
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
