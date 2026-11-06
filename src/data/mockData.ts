import { Therapist, WorkUnit, ShiftEntry, Absence, FixedSchedulePattern } from '../types';

export const INITIAL_THERAPISTS: Therapist[] = [
  {
    id: 'f1',
    name: 'Franklin George',
    crfa: '',
    contractHoursPerWeek: 40,
    defaultUnitId: 'u_videplast',
    phone: '(49) 99124-8831',
    email: 'franklin.george@sesisc.org.br',
    specialties: ['Audiometria Ocupacional', 'Gestão de Escalas', 'PCA'],
    color: '#0284c7', // Sky Blue
    active: true,
  },
  {
    id: 'f2',
    name: 'Wagner',
    crfa: '',
    contractHoursPerWeek: 40,
    defaultUnitId: 'u_master_mb',
    phone: '(49) 98845-1290',
    email: 'wagner@sesisc.org.br',
    specialties: ['Audiometria Ocupacional', 'Saúde do Trabalhador', 'Ruído'],
    color: '#0d9488', // Teal
    active: true,
  },
  {
    id: 'f3',
    name: 'Ancila',
    crfa: '',
    contractHoursPerWeek: 40,
    defaultUnitId: 'u_master_cetrevi',
    phone: '(49) 99650-4412',
    email: 'ancila@sesisc.org.br',
    specialties: ['Exames Periódicos', 'Audiologia Clínica', 'Voz'],
    color: '#7c3aed', // Violet
    active: true,
  },
  {
    id: 'f4',
    name: 'Elis',
    crfa: '',
    contractHoursPerWeek: 40,
    defaultUnitId: 'u_adami',
    phone: '(49) 99231-7788',
    email: 'elis@sesisc.org.br',
    specialties: ['Conservação Auditiva', 'Audiometria Tonal e Vocal'],
    color: '#ea580c', // Orange
    active: true,
  },
  {
    id: 'f5',
    name: 'Silvia',
    crfa: '',
    contractHoursPerWeek: 40,
    defaultUnitId: 'u_brf',
    phone: '(49) 98412-3001',
    email: 'silvia@sesisc.org.br',
    specialties: ['PCA', 'Exames In-Company', 'Triagem Auditiva'],
    color: '#16a34a', // Emerald
    active: true,
  },
  {
    id: 'f6',
    name: 'Carol',
    crfa: '',
    contractHoursPerWeek: 40,
    defaultUnitId: 'u_sesi_videira',
    phone: '(49) 99182-3399',
    email: 'carol@sesisc.org.br',
    specialties: ['Audiologia Ocupacional', 'Imitanciometria'],
    color: '#e11d48', // Rose
    active: true,
  },
  {
    id: 'f7',
    name: 'Daiane',
    crfa: '',
    contractHoursPerWeek: 30,
    defaultUnitId: 'u_sesi_cacador',
    phone: '(49) 98822-1940',
    email: 'daiane@sesisc.org.br',
    specialties: ['Plantões & Cobertura', 'Audiometria Periódica'],
    color: '#4f46e5', // Indigo
    active: true,
  },
  {
    id: 'f8',
    name: 'Leidiane',
    crfa: '',
    contractHoursPerWeek: 30,
    defaultUnitId: 'u_sesi_curitibanos',
    phone: '(49) 99876-5432',
    email: 'leidiane@sesisc.org.br',
    specialties: ['Audiometria Ocupacional', 'Saúde Vocal'],
    color: '#0891b2', // Cyan
    active: true,
  },
];

export const INITIAL_UNITS: WorkUnit[] = [
  {
    id: 'u_videplast',
    name: 'Videplast',
    type: 'empresa_in_company',
    city: 'Videira / SC',
    roomsCount: 2,
    contactPerson: 'Ambulatório Videplast SST',
    notes: 'Exames ocupacionais periódicos e PCA.',
  },
  {
    id: 'u_master_mb',
    name: 'Master Monte Berico',
    type: 'empresa_in_company',
    city: 'Videira / SC',
    roomsCount: 2,
    contactPerson: 'Saúde Ocupacional Master',
    notes: 'Atendimento in-company para conservação auditiva.',
  },
  {
    id: 'u_master_cetrevi',
    name: 'Master Cetrevi',
    type: 'empresa_in_company',
    city: 'Videira / SC',
    roomsCount: 2,
    contactPerson: 'Supervisão CETREVI',
    notes: 'Triagens auditivas e exames admissionais/periódicos.',
  },
  {
    id: 'u_adami',
    name: 'Adami',
    type: 'empresa_in_company',
    city: 'Caçador / SC',
    roomsCount: 2,
    contactPerson: 'Ambulatório Adami S/A',
    notes: 'Monitoramento contínuo de ruído industrial.',
  },
  {
    id: 'u_brf',
    name: 'BRF',
    type: 'empresa_in_company',
    city: 'Videira / SC',
    roomsCount: 3,
    contactPerson: 'Medicina do Trabalho BRF',
    notes: 'Atendimento contínuo em turnos matutino e vespertino.',
  },
  {
    id: 'u_sesi_videira',
    name: 'SESI Videira',
    type: 'unidade_fixa',
    city: 'Videira / SC',
    roomsCount: 4,
    contactPerson: 'Coordenação SESI Videira',
    notes: 'Cabines audiométricas e exames clínicos de referência.',
  },
  {
    id: 'u_sesi_cacador',
    name: 'Sesi Caçador',
    type: 'unidade_fixa',
    city: 'Caçador / SC',
    roomsCount: 3,
    contactPerson: 'Coordenação SESI Caçador',
    notes: 'Unidade regional integrada de saúde ocupacional.',
  },
  {
    id: 'u_sesi_curitibanos',
    name: 'Sesi Curitibanos',
    type: 'unidade_fixa',
    city: 'Curitibanos / SC',
    roomsCount: 3,
    contactPerson: 'Coordenação SESI Curitibanos',
    notes: 'Atendimento clínico e ocupacional para a região serrana.',
  },
  {
    id: 'u_trombini',
    name: 'Trombini',
    type: 'empresa_in_company',
    city: 'Curitibanos / SC',
    roomsCount: 2,
    contactPerson: 'SST Trombini Papel e Embalagens',
    notes: 'Exames periódicos audiométricos e controle de ruído.',
  },
];

export const INITIAL_FIXED_PATTERNS: FixedSchedulePattern[] = [
  // Franklin George (f1): Manhã Videplast, Tarde Master Monte Berico
  { id: 'fp-1', unitId: 'u_videplast', weekday: 1, therapistId: 'f1', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_videplast', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_master_mb', nightStart: '', nightEnd: '' },
  { id: 'fp-2', unitId: 'u_videplast', weekday: 2, therapistId: 'f1', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_videplast', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_master_mb', nightStart: '', nightEnd: '' },
  { id: 'fp-3', unitId: 'u_videplast', weekday: 3, therapistId: 'f1', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_videplast', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_master_mb', nightStart: '', nightEnd: '' },
  { id: 'fp-4', unitId: 'u_videplast', weekday: 4, therapistId: 'f1', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_videplast', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_master_mb', nightStart: '', nightEnd: '' },
  { id: 'fp-5', unitId: 'u_videplast', weekday: 5, therapistId: 'f1', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_videplast', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_master_mb', nightStart: '', nightEnd: '' },

  // Wagner (f2): Manhã Master Cetrevi, Tarde BRF
  { id: 'fp-6', unitId: 'u_master_cetrevi', weekday: 1, therapistId: 'f2', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_master_cetrevi', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_brf', nightStart: '', nightEnd: '' },
  { id: 'fp-7', unitId: 'u_master_cetrevi', weekday: 2, therapistId: 'f2', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_master_cetrevi', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_brf', nightStart: '', nightEnd: '' },
  { id: 'fp-8', unitId: 'u_master_cetrevi', weekday: 3, therapistId: 'f2', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_master_cetrevi', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_brf', nightStart: '', nightEnd: '' },
  { id: 'fp-9', unitId: 'u_master_cetrevi', weekday: 4, therapistId: 'f2', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_master_cetrevi', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_brf', nightStart: '', nightEnd: '' },
  { id: 'fp-10', unitId: 'u_master_cetrevi', weekday: 5, therapistId: 'f2', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_master_cetrevi', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_brf', nightStart: '', nightEnd: '' },

  // Ancila (f3): Manhã SESI Videira, Tarde Videplast
  { id: 'fp-11', unitId: 'u_sesi_videira', weekday: 1, therapistId: 'f3', morningStart: '08:00', morningEnd: '12:00', morningUnitId: 'u_sesi_videira', afternoonStart: '13:30', afternoonEnd: '17:30', afternoonUnitId: 'u_videplast', nightStart: '', nightEnd: '' },
  { id: 'fp-12', unitId: 'u_sesi_videira', weekday: 2, therapistId: 'f3', morningStart: '08:00', morningEnd: '12:00', morningUnitId: 'u_sesi_videira', afternoonStart: '13:30', afternoonEnd: '17:30', afternoonUnitId: 'u_videplast', nightStart: '', nightEnd: '' },
  { id: 'fp-13', unitId: 'u_sesi_videira', weekday: 3, therapistId: 'f3', morningStart: '08:00', morningEnd: '12:00', morningUnitId: 'u_sesi_videira', afternoonStart: '13:30', afternoonEnd: '17:30', afternoonUnitId: 'u_videplast', nightStart: '', nightEnd: '' },
  { id: 'fp-14', unitId: 'u_sesi_videira', weekday: 4, therapistId: 'f3', morningStart: '08:00', morningEnd: '12:00', morningUnitId: 'u_sesi_videira', afternoonStart: '13:30', afternoonEnd: '17:30', afternoonUnitId: 'u_videplast', nightStart: '', nightEnd: '' },
  { id: 'fp-15', unitId: 'u_sesi_videira', weekday: 5, therapistId: 'f3', morningStart: '08:00', morningEnd: '12:00', morningUnitId: 'u_sesi_videira', afternoonStart: '13:30', afternoonEnd: '17:30', afternoonUnitId: 'u_videplast', nightStart: '', nightEnd: '' },

  // Elis (f4): Manhã Adami, Tarde Sesi Caçador
  { id: 'fp-16', unitId: 'u_adami', weekday: 1, therapistId: 'f4', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_adami', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_sesi_cacador', nightStart: '', nightEnd: '' },
  { id: 'fp-17', unitId: 'u_adami', weekday: 2, therapistId: 'f4', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_adami', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_sesi_cacador', nightStart: '', nightEnd: '' },
  { id: 'fp-18', unitId: 'u_adami', weekday: 3, therapistId: 'f4', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_adami', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_sesi_cacador', nightStart: '', nightEnd: '' },
  { id: 'fp-19', unitId: 'u_adami', weekday: 4, therapistId: 'f4', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_adami', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_sesi_cacador', nightStart: '', nightEnd: '' },
  { id: 'fp-20', unitId: 'u_adami', weekday: 5, therapistId: 'f4', morningStart: '07:30', morningEnd: '11:30', morningUnitId: 'u_adami', afternoonStart: '13:00', afternoonEnd: '17:00', afternoonUnitId: 'u_sesi_cacador', nightStart: '', nightEnd: '' },
];

const getRelativeIso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_ABSENCES: Absence[] = [
  {
    id: 'abs-1',
    therapistId: 'f3', // Ancila em férias
    type: 'ferias',
    startDate: getRelativeIso(-1),
    endDate: getRelativeIso(7),
    reason: 'Férias regulares',
    createdAt: new Date().toISOString(),
  },
];

// Gera escalas iniciais para os dias da semana atual
export const INITIAL_SHIFTS: ShiftEntry[] = [
  // Franklin George (f1)
  {
    id: 'sh-1',
    date: getRelativeIso(0),
    therapistId: 'f1',
    unitId: 'u_videplast',
    morningStart: '07:30',
    morningEnd: '11:30',
    morningUnitId: 'u_videplast',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    afternoonUnitId: 'u_master_mb',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
    notes: 'Manhã na Videplast e Tarde na Master Monte Berico',
  },
  {
    id: 'sh-1b',
    date: getRelativeIso(1),
    therapistId: 'f1',
    unitId: 'u_videplast',
    morningStart: '07:30',
    morningEnd: '11:30',
    morningUnitId: 'u_videplast',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    afternoonUnitId: 'u_master_mb',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
  },

  // Wagner (f2)
  {
    id: 'sh-2',
    date: getRelativeIso(0),
    therapistId: 'f2',
    unitId: 'u_master_cetrevi',
    morningStart: '07:30',
    morningEnd: '11:30',
    morningUnitId: 'u_master_cetrevi',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    afternoonUnitId: 'u_brf',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
    notes: 'Manhã no Master Cetrevi e Tarde na BRF',
  },
  {
    id: 'sh-2b',
    date: getRelativeIso(1),
    therapistId: 'f2',
    unitId: 'u_master_cetrevi',
    morningStart: '07:30',
    morningEnd: '11:30',
    morningUnitId: 'u_master_cetrevi',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    afternoonUnitId: 'u_brf',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
  },

  // Ancila (f3) - Em férias (Vaga aberta para cobertura)
  {
    id: 'sh-3',
    date: getRelativeIso(0),
    therapistId: 'f3',
    unitId: 'u_sesi_videira',
    morningStart: '08:00',
    morningEnd: '12:00',
    morningUnitId: 'u_sesi_videira',
    afternoonStart: '13:30',
    afternoonEnd: '17:30',
    afternoonUnitId: 'u_videplast',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
    isVacant: true,
    notes: 'Ancila em férias! Necessita substituição por período.',
  },

  // Elis (f4)
  {
    id: 'sh-4',
    date: getRelativeIso(0),
    therapistId: 'f4',
    unitId: 'u_adami',
    morningStart: '07:30',
    morningEnd: '11:30',
    morningUnitId: 'u_adami',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    afternoonUnitId: 'u_sesi_cacador',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
    notes: 'Manhã na Adami e Tarde no Sesi Caçador',
  },

  // Silvia (f5)
  {
    id: 'sh-5',
    date: getRelativeIso(0),
    therapistId: 'f5',
    unitId: 'u_brf',
    morningStart: '08:00',
    morningEnd: '12:00',
    morningUnitId: 'u_brf',
    afternoonStart: '13:30',
    afternoonEnd: '17:30',
    afternoonUnitId: 'u_sesi_videira',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
    notes: 'Manhã na BRF e Tarde no SESI Videira',
  },

  // Carol (f6)
  {
    id: 'sh-6',
    date: getRelativeIso(0),
    therapistId: 'f6',
    unitId: 'u_sesi_videira',
    morningStart: '08:00',
    morningEnd: '12:00',
    morningUnitId: 'u_sesi_videira',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    afternoonUnitId: 'u_master_cetrevi',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
  },

  // Daiane (f7)
  {
    id: 'sh-7',
    date: getRelativeIso(0),
    therapistId: 'f7',
    unitId: 'u_sesi_cacador',
    morningStart: '08:00',
    morningEnd: '12:00',
    morningUnitId: 'u_sesi_cacador',
    afternoonStart: '13:00',
    afternoonEnd: '15:00',
    afternoonUnitId: 'u_adami',
    nightStart: '',
    nightEnd: '',
    isCoverage: false,
  },

  // Leidiane (f8) - Com Turno Noite para demonstrar 3 empresas no mesmo dia!
  {
    id: 'sh-8',
    date: getRelativeIso(0),
    therapistId: 'f8',
    unitId: 'u_sesi_curitibanos',
    morningStart: '08:00',
    morningEnd: '11:00',
    morningUnitId: 'u_sesi_curitibanos',
    afternoonStart: '12:30',
    afternoonEnd: '15:30',
    afternoonUnitId: 'u_trombini',
    nightStart: '17:00',
    nightEnd: '19:00',
    nightUnitId: 'u_sesi_videira',
    isCoverage: false,
    notes: '3 empresas no mesmo dia: Manhã no Sesi Curitibanos, Tarde na Trombini, Noite no SESI Videira',
  },
];
