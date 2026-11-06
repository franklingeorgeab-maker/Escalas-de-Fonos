import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { ShiftEntry } from '../types';
import {
  formatDateBR,
  formatDayWithWeekday,
  formatMinutesToHours,
  calculateShiftDuration,
} from '../utils/timeCalculations';

interface ImportExportModalProps {
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ onClose }) => {
  const {
    shifts,
    therapists,
    units,
    selectedDate,
    importShifts,
    resetToDefaults,
  } = useSchedule();

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'print'>('export');
  const [pasteData, setPasteData] = useState('');
  const [importFeedback, setImportFeedback] = useState<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null);

  const therapistMap = new Map(therapists.map((t) => [t.id, t]));
  const unitMap = new Map(units.map((u) => [u.id, u]));

  // Escalas da data selecionada para exportação ou impressão
  const dayShifts = shifts.filter((s) => s.date === selectedDate);

  // 1. Exportar para CSV
  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Fonoaudiologo',
      'CRFa',
      'Unidade_Empresa',
      'Manha_Inicio',
      'Manha_Fim',
      'Tarde_Inicio',
      'Tarde_Fim',
      'Noite_Inicio',
      'Noite_Fim',
      'Total_Horas',
      'Substituicao_Cobertura',
      'Observacoes',
    ];

    const rows = shifts.map((s) => {
      const t = therapistMap.get(s.therapistId);
      const u = unitMap.get(s.unitId);
      const dur = calculateShiftDuration(s);

      return [
        s.date,
        `"${t?.name || (s.isVacant ? 'Vaga Descoberta' : 'Profissional')}"`,
        `"${t?.crfa || ''}"`,
        `"${u?.name || ''}"`,
        s.morningStart || '',
        s.morningEnd || '',
        s.afternoonStart || '',
        s.afternoonEnd || '',
        s.nightStart || '',
        s.nightEnd || '',
        formatMinutesToHours(dur.totalMinutes),
        s.isCoverage ? `"${s.coverageReason || 'Cobertura'}"` : 'Regular',
        `"${s.notes || ''}"`,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `escala_fonoaudiologia_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Importar do modelo colado (CSV ou TSV)
  const handleProcessImport = () => {
    if (!pasteData.trim()) return;

    try {
      const lines = pasteData.trim().split('\n');
      const newShifts: ShiftEntry[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Se for cabeçalho, pula
        if (i === 0 && (line.toLowerCase().includes('data') || line.toLowerCase().includes('fono'))) {
          continue;
        }

        // Divide por tabulação ou ponto-e-vírgula ou vírgula
        const separator = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
        const cols = line.split(separator).map((c) => c.replace(/"/g, '').trim());

        // Espera no mínimo: Data, Nome, Unidade, Manhã Início, Manhã Fim, Tarde Início, Tarde Fim
        if (cols.length >= 4) {
          const rawDate = cols[0] || selectedDate;
          const rawName = cols[1] || '';
          const rawUnit = cols[2] || '';

          // Achar terapeuta pelo nome
          const matchedTherapist = therapists.find((t) =>
            t.name.toLowerCase().includes(rawName.toLowerCase())
          );
          const matchedUnit = units.find((u) =>
            u.name.toLowerCase().includes(rawUnit.toLowerCase())
          );

          newShifts.push({
            id: `imp_${Date.now()}_${i}`,
            date: rawDate.includes('/') ? rawDate.split('/').reverse().join('-') : rawDate,
            therapistId: matchedTherapist?.id || therapists[0]?.id || '',
            unitId: matchedUnit?.id || units[0]?.id || '',
            morningStart: cols[3] || '08:00',
            morningEnd: cols[4] || '12:00',
            afternoonStart: cols[5] || '13:00',
            afternoonEnd: cols[6] || '17:00',
            nightStart: cols[7] || '',
            nightEnd: cols[8] || '',
            isCoverage: false,
            notes: 'Importado de planilha externa',
          });
        }
      }

      if (newShifts.length > 0) {
        importShifts(newShifts);
        setImportFeedback({
          success: true,
          count: newShifts.length,
          message: `${newShifts.length} linha(s) de escala importada(s) com sucesso!`,
        });
        setPasteData('');
      } else {
        setImportFeedback({
          success: false,
          count: 0,
          message: 'Não foi possível identificar linhas válidas. Verifique o formato copiado.',
        });
      }
    } catch (err: any) {
      setImportFeedback({
        success: false,
        count: 0,
        message: 'Erro ao processar dados: ' + (err?.message || 'formato inválido'),
      });
    }
  };

  // 3. Imprimir
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-semibold text-slate-900">
              Integração de Planilha & Relatórios
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar para Excel / CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar / Colar Linhas</span>
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'print'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Visualização para Impressão</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tab 1: Export */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-1">
                  Exportação de Escalas em Formato Padrão
                </p>
                <p>
                  Gera um arquivo compatível com Microsoft Excel, Google Planilhas e LibreOffice com as colunas exatas do seu modelo:
                  <strong> Fonoaudiólogo, Unidade, Manhã Início/Fim, Tarde Início/Fim, Noite Início/Fim, Carga Diária e Status de Cobertura</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Todas as Escalas do Sistema ({shifts.length} registros)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Inclui coberturas ativas e observações de afastamento.
                  </div>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Planilha (.CSV)</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Import */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Copie as linhas da sua planilha e cole no campo abaixo. O sistema identificará automaticamente os profissionais, unidades e horários de manhã e tarde:
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-mono text-[11px] text-slate-600">
                <span className="font-semibold text-slate-800">Modelo esperado (separado por tab ou ponto-e-vírgula):</span>
                <br />
                Data | Fonoaudiólogo | Unidade | Manhã Início | Manhã Fim | Tarde Início | Tarde Fim
                <br />
                <span className="text-slate-400">
                  Ex: 2026-11-10; Dra. Juliana Silveira; SESI Saúde Matriz; 08:00; 12:00; 13:00; 17:00
                </span>
              </div>

              <textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="Cole aqui as linhas da sua planilha..."
                rows={6}
                className="w-full text-xs font-mono p-3 rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />

              {importFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    importFeedback.success
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importFeedback.success ? (
                    <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importFeedback.message}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleProcessImport}
                  disabled={!pasteData.trim()}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 ${
                    pasteData.trim()
                      ? 'bg-teal-700 hover:bg-teal-800'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Processar e Adicionar Escalas</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Print Preview */}
          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Escala de Fonoaudiologia — {formatDayWithWeekday(selectedDate)}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pronto para envio aos consultórios ou fixação no mural da unidade.
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Agora</span>
                </button>
              </div>

              {/* Printable frame preview */}
              <div className="border border-slate-300 rounded-lg p-5 bg-white text-xs space-y-4 print:border-none print:p-0">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      SESI Saúde — Escala Operacional de Fonoaudiologia
                    </h2>
                    <p className="text-xs text-slate-600">
                      Data: {formatDateBR(selectedDate)} ({formatDayWithWeekday(selectedDate)})
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 font-mono">
                    Emitido: {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 font-semibold text-slate-700 bg-slate-50">
                      <th className="py-2 px-2">Profissional</th>
                      <th className="py-2 px-2">CRFa</th>
                      <th className="py-2 px-2">Unidade / Empresa</th>
                      <th className="py-2 px-2 text-center">Manhã</th>
                      <th className="py-2 px-2 text-center">Tarde</th>
                      <th className="py-2 px-2 text-center">Noite</th>
                      <th className="py-2 px-2 text-center">Carga</th>
                      <th className="py-2 px-2">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {dayShifts.map((s) => {
                      const t = therapistMap.get(s.therapistId);
                      const u = unitMap.get(s.unitId);
                      const dur = calculateShiftDuration(s);
                      return (
                        <tr key={s.id} className="py-1.5">
                          <td className="py-2 px-2 font-medium text-slate-900">
                            {t?.name || (s.isVacant ? 'Vaga Descoberta' : 'Profissional')}
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-600">{t?.crfa}</td>
                          <td className="py-2 px-2 text-slate-700">{u?.name}</td>
                          <td className="py-2 px-2 text-center font-mono">
                            {s.morningStart && s.morningEnd
                              ? `${s.morningStart}-${s.morningEnd}`
                              : '—'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {s.afternoonStart && s.afternoonEnd
                              ? `${s.afternoonStart}-${s.afternoonEnd}`
                              : '—'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {s.nightStart && s.nightEnd
                              ? `${s.nightStart}-${s.nightEnd}`
                              : '—'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-semibold">
                            {formatMinutesToHours(dur.totalMinutes)}
                          </td>
                          <td className="py-2 px-2 text-slate-500 italic">
                            {s.coverageReason || s.notes || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="pt-8 grid grid-cols-2 gap-8 text-[11px] text-slate-600">
                  <div className="border-t border-slate-300 pt-1 text-center">
                    Coordenação de Saúde Ocupacional / SST
                  </div>
                  <div className="border-t border-slate-300 pt-1 text-center">
                    Supervisão Técnica de Fonoaudiologia
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reset button section */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Deseja restaurar os dados de simulação padrão?</span>
            <button
              onClick={() => {
                if (confirm('Restaurar dados originais de simulação? Todas as alterações salvas serão resetadas.')) {
                  resetToDefaults();
                  onClose();
                }
              }}
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Mocks Originais</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
