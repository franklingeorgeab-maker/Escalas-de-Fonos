import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Building2,
  Clock,
  Palette,
  Check,
  Phone,
  Mail,
  Award,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { THERAPIST_COLOR_PALETTES } from '../utils/colorThemes';

interface AddCollaboratorModalProps {
  onClose: () => void;
}

const COMMON_SPECIALTIES = [
  'Audiometria Ocupacional',
  'Exames Periódicos',
  'PCA (Conservação Auditiva)',
  'Triagem de Ruído Industrial',
  'Audiologia Clínica',
  'Saúde Vocal',
  'Unidade Móvel',
];

export const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ onClose }) => {
  const { units, therapists, addTherapist } = useSchedule();

  const [name, setName] = useState('');
  const [contractHoursPerWeek, setContractHoursPerWeek] = useState<number>(40);
  const [defaultUnitId, setDefaultUnitId] = useState<string>(units[0]?.id || '');

  // Escolhe uma cor não utilizada ou a próxima da lista
  const [selectedHex, setSelectedHex] = useState<string>(() => {
    const usedColors = new Set(therapists.map((t) => t.color.toLowerCase()));
    const available = THERAPIST_COLOR_PALETTES.find(
      (p) => !usedColors.has(p.hex.toLowerCase())
    );
    return available ? available.hex : THERAPIST_COLOR_PALETTES[0].hex;
  });

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    'Audiometria Ocupacional',
    'Exames Periódicos',
  ]);
  const [customSpecialty, setCustomSpecialty] = useState('');

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleAddCustomSpecialty = () => {
    if (customSpecialty.trim() && !selectedSpecialties.includes(customSpecialty.trim())) {
      setSelectedSpecialties((prev) => [...prev, customSpecialty.trim()]);
      setCustomSpecialty('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.replace(/^(Dr\.|Dra\.)\s*/i, '').trim();
    if (!cleanName) {
      alert('Por favor, informe o nome do colaborador.');
      return;
    }

    addTherapist({
      name: cleanName,
      crfa: '',
      contractHoursPerWeek,
      defaultUnitId,
      phone: phone.trim() || '(48) 99999-0000',
      email: email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@sesisc.org.br`,
      specialties: selectedSpecialties,
      color: selectedHex,
      active: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-800">
              <UserPlus className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Incluir Novo Colaborador
              </h3>
              <p className="text-xs text-slate-500">
                Cadastre o fonoaudiólogo com sua respectiva cor exclusiva no sistema.
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Nome do Profissional (sem Dr/Dra) */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Nome do Profissional (sem títulos ou registros)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carolina Duarte, Marcelo Silveira"
              className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none text-xs"
              required
            />
          </div>

          {/* Grid: Carga Horária e Empresa Principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Carga Horária Semanal</span>
              </label>
              <select
                value={contractHoursPerWeek}
                onChange={(e) => setContractHoursPerWeek(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none text-xs"
              >
                <option value={20}>20 Horas / semana</option>
                <option value={30}>30 Horas / semana</option>
                <option value={40}>40 Horas / semana</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Unidade / Empresa Padrão</span>
              </label>
              <select
                value={defaultUnitId}
                onChange={(e) => setDefaultUnitId(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none text-xs"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seletor de Cor Exclusiva do Profissional */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              <span>Cor Exclusiva no Sistema</span>
              <span className="text-[11px] font-normal text-slate-500 ml-1">
                (identifica visualmente o colaborador nas escalas e tabelas)
              </span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {THERAPIST_COLOR_PALETTES.map((pal) => {
                const isSelected = selectedHex.toLowerCase() === pal.hex.toLowerCase();
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => setSelectedHex(pal.hex)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? `border-slate-800 ring-2 ring-slate-800 bg-white font-bold`
                        : `${pal.badgeBg} ${pal.badgeBorder} hover:opacity-90`
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-white"
                      style={{ backgroundColor: pal.hex }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="text-[11px] text-slate-800 truncate">
                      {pal.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-500" />
              <span>Especialidades / Áreas de Atuação</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_SPECIALTIES.map((spec) => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 font-semibold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>

            {/* Inserir especialidade personalizada */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSpecialty();
                  }
                }}
                placeholder="Outra especialidade (pressione Adicionar)..."
                className="flex-1 rounded-md border border-slate-300 p-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomSpecialty}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-semibold text-xs"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Telefone e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Telefone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(48) 99123-4567"
                className="w-full rounded-md border border-slate-300 p-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>E-mail Institucional</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@sesisc.org.br"
                className="w-full rounded-md border border-slate-300 p-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Footer */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Incluir Colaborador</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
