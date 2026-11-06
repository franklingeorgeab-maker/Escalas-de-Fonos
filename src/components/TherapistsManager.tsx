import React, { useState } from 'react';
import {
  Users,
  Building2,
  Plus,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Sparkles,
  Edit2,
  Stethoscope,
  Briefcase,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { Therapist, WorkUnit } from '../types';
import { formatMinutesToHours, calculateShiftDuration } from '../utils/timeCalculations';

export const TherapistsManager: React.FC = () => {
  const {
    therapists,
    units,
    shifts,
    addTherapist,
    updateTherapist,
    addUnit,
    updateUnit,
  } = useSchedule();

  const [activeSubTab, setActiveSubTab] = useState<'therapists' | 'units'>('therapists');
  const [isAddTherapistOpen, setIsAddTherapistOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);

  // Form states for new therapist
  const [name, setName] = useState('');
  const [crfa, setCrfa] = useState('');
  const [contractHours, setContractHours] = useState(40);
  const [defaultUnitId, setDefaultUnitId] = useState(units[0]?.id || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialtiesStr, setSpecialtiesStr] = useState('');

  // Form states for new unit
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState<'unidade_fixa' | 'empresa_in_company' | 'unidade_movel'>('empresa_in_company');
  const [city, setCity] = useState('');
  const [roomsCount, setRoomsCount] = useState(2);
  const [unitNotes, setUnitNotes] = useState('');

  const handleCreateTherapist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !crfa) return;

    addTherapist({
      name,
      crfa,
      contractHoursPerWeek: contractHours,
      defaultUnitId: defaultUnitId || units[0]?.id || '',
      phone: phone || '(48) 90000-0000',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@sesisc.org.br`,
      specialties: specialtiesStr
        ? specialtiesStr.split(',').map((s) => s.trim())
        : ['Audiologia Clínica'],
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      active: true,
    });

    setName('');
    setCrfa('');
    setPhone('');
    setEmail('');
    setSpecialtiesStr('');
    setIsAddTherapistOpen(false);
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName) return;

    addUnit({
      name: unitName,
      type: unitType,
      city: city || 'Santa Catarina',
      roomsCount,
      notes: unitNotes,
    });

    setUnitName('');
    setCity('');
    setUnitNotes('');
    setIsAddUnitOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Subtab Toggle & Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Cadastro de Equipe e Unidades de Atendimento
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Gerencie os fonoaudiólogos da equipe, suas unidades-base e a capacidade dos consultórios e ambulatórios in-company.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveSubTab('therapists')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'therapists'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Fonoaudiólogos ({therapists.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('units')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'units'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Unidades / Empresas ({units.length})</span>
            </button>
          </div>

          {activeSubTab === 'therapists' ? (
            <button
              onClick={() => setIsAddTherapistOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Fonoaudiólogo</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddUnitOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Unidade / Empresa</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab Content: Therapists */}
      {activeSubTab === 'therapists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {therapists.map((therapist) => {
            const baseUnit = units.find((u) => u.id === therapist.defaultUnitId);
            const therapistShifts = shifts.filter((s) => s.therapistId === therapist.id);

            let totalMinutesAllocated = 0;
            therapistShifts.forEach((s) => {
              totalMinutesAllocated += calculateShiftDuration(s).totalMinutes;
            });

            return (
              <div
                key={therapist.id}
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: therapist.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">
                        {therapist.name}
                      </h3>
                      <div className="text-xs text-slate-500 font-mono">
                        {therapist.crfa} · {therapist.contractHoursPerWeek}h semanais
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    Ativo
                  </span>
                </div>

                {/* Base Unit */}
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Unidade Base: {baseUnit?.name || 'Geral / Volante'}</span>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                  {therapist.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="bg-slate-100 px-2 py-0.5 rounded text-slate-700"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Contact info */}
                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{therapist.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{therapist.email}</span>
                  </div>
                </div>

                {/* Shifts stat */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Horas Alocadas:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatMinutesToHours(totalMinutesAllocated)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab Content: Units */}
      {activeSubTab === 'units' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => {
            const assignedTherapists = therapists.filter(
              (t) => t.defaultUnitId === unit.id
            );

            return (
              <div
                key={unit.id}
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">
                      {unit.name}
                    </h3>
                    <div className="text-xs text-slate-500">{unit.city}</div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      unit.type === 'unidade_fixa'
                        ? 'bg-blue-50 text-blue-700'
                        : unit.type === 'empresa_in_company'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {unit.type === 'unidade_fixa'
                      ? 'Unidade Fixa'
                      : unit.type === 'empresa_in_company'
                      ? 'In-Company'
                      : 'Unidade Móvel'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Consultórios / Cabines: {unit.roomsCount} salas</span>
                </div>

                {unit.notes && (
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2 rounded">
                    {unit.notes}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Fonos habituais na unidade: </span>
                  <span className="font-semibold text-slate-700">
                    {assignedTherapists.map((t) => t.name.split(' ')[1] || t.name).join(', ') ||
                      'Sem fono fixo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Novo Fonoaudiólogo */}
      {isAddTherapistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">
                Cadastrar Fonoaudiólogo(a)
              </h3>
              <button
                onClick={() => setIsAddTherapistOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTherapist} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dra. Larissa Carvalho"
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Registro CRFa
                  </label>
                  <input
                    type="text"
                    value={crfa}
                    onChange={(e) => setCrfa(e.target.value)}
                    placeholder="CRFa 3-00000"
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 font-mono focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Carga Semanal
                  </label>
                  <select
                    value={contractHours}
                    onChange={(e) => setContractHours(Number(e.target.value))}
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value={20}>20 horas / semana</option>
                    <option value={30}>30 horas / semana</option>
                    <option value={40}>40 horas / semana</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Unidade Base Habitual
                </label>
                <select
                  value={defaultUnitId}
                  onChange={(e) => setDefaultUnitId(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Telefone / Celular
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(48) 99999-0000"
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@sesisc.org.br"
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Especialidades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={specialtiesStr}
                  onChange={(e) => setSpecialtiesStr(e.target.value)}
                  placeholder="Audiometria Ocupacional, Voz, Triagem"
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTherapistOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
                >
                  Salvar Fonoaudiólogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Unidade */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">
                Cadastrar Unidade ou Empresa Parceira
              </h3>
              <button
                onClick={() => setIsAddUnitOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nome da Unidade / Empresa
                </label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Ex: Empresa WEG Motores (In-Company)"
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tipo de Estrutura
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) =>
                      setUnitType(e.target.value as 'unidade_fixa' | 'empresa_in_company' | 'unidade_movel')
                    }
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="empresa_in_company">Empresa In-Company</option>
                    <option value="unidade_fixa">Unidade Fixa SESI</option>
                    <option value="unidade_movel">Unidade Móvel</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Cabines / Salas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={roomsCount}
                    onChange={(e) => setRoomsCount(Number(e.target.value))}
                    className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cidade / Localização
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Joinville / SC"
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Observações de Atendimento
                </label>
                <textarea
                  value={unitNotes}
                  onChange={(e) => setUnitNotes(e.target.value)}
                  placeholder="Ex: Exames periódicos de audiometria ocupacional para trabalhadores com ruído..."
                  rows={3}
                  className="w-full text-xs rounded-md border border-slate-200 p-2 bg-white text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
                >
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
