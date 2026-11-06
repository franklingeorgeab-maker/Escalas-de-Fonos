export type ShiftPeriodType = 'manha' | 'tarde' | 'noite';

export interface Therapist {
  id: string;
  name: string;
  crfa: string;
  contractHoursPerWeek: number; // e.g. 30 or 40
  defaultUnitId: string;
  phone: string;
  email: string;
  specialties: string[];
  color: string;
  active: boolean;
}

export interface WorkUnit {
  id: string;
  name: string;
  type: 'unidade_fixa' | 'empresa_in_company' | 'unidade_movel';
  city: string;
  roomsCount: number;
  contactPerson?: string;
  notes?: string;
}

export interface FixedSchedulePattern {
  id: string;
  unitId: string; // Empresa principal / fallback
  weekday: 1 | 2 | 3 | 4 | 5; // 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta
  therapistId: string;
  morningStart: string;
  morningEnd: string;
  morningUnitId?: string; // Empresa turno manhã
  afternoonStart: string;
  afternoonEnd: string;
  afternoonUnitId?: string; // Empresa turno tarde
  nightStart: string;
  nightEnd: string;
  nightUnitId?: string; // Empresa turno noite
}

export interface ShiftEntry {
  id: string;
  date: string; // YYYY-MM-DD
  therapistId: string;
  unitId: string; // Empresa padrão / fallback
  
  // Turno da Manhã
  morningStart: string; // "07:30" or ""
  morningEnd: string;   // "11:30" or ""
  morningUnitId?: string; // Empresa do turno da manhã
  
  // Turno da Tarde
  afternoonStart: string; // "12:30" or ""
  afternoonEnd: string;   // "16:30" or ""
  afternoonUnitId?: string; // Empresa do turno da tarde
  
  // Turno da Noite / Extra
  nightStart: string;   // "17:00" or ""
  nightEnd: string;     // "19:30" or ""
  nightUnitId?: string; // Empresa do turno da noite
  
  // Metadata & Remanejamento
  isCoverage: boolean;
  coveringForTherapistId?: string;
  coverageReason?: string;
  isTemporary?: boolean; // Escala temporária de 1 dia (ex: mutirão, evento pontual, plantão extra)
  temporaryReason?: string; // Motivo da escala temporária
  notes?: string;
  isVacant?: boolean; // Se a vaga está aberta precisando de cobertura urgente
}

export type AbsenceType = 
  | 'ferias' 
  | 'licenca_saude' 
  | 'atestado' 
  | 'capacitacao' 
  | 'folga_compensatoria';

export interface Absence {
  id: string;
  therapistId: string;
  type: AbsenceType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  createdAt: string;
}

export interface DailyCalculation {
  totalHoursWorked: number; // in hours, e.g. 8.5
  totalMinutesWorked: number;
  morningMinutes: number;
  afternoonMinutes: number;
  nightMinutes: number;
  intrajornadaMinutes: number; // Intervalo de almoço/descanso no dia
  firstStartTime: string | null;
  lastEndTime: string | null;
  interjornadaRestPrevDayHours: number | null; // Descanso desde o dia anterior
  interjornadaRestNextDayHours: number | null; // Descanso até o dia seguinte
}

export type ComplianceSeverity = 'error' | 'warning' | 'info';

export interface ComplianceViolation {
  id: string;
  shiftId?: string;
  therapistId: string;
  therapistName: string;
  date: string;
  rule: 'MAX_10_HOURS' | 'MIN_12_HOURS_INTERJORNADA' | 'INTRAJORNADA_INTERVAL' | 'TIME_OVERLAP' | 'ABSENCE_COLLISION' | 'CONSECUTIVE_DAYS';
  severity: ComplianceSeverity;
  title: string;
  description: string;
  recommendation: string;
}

export interface CandidateAvailability {
  therapist: Therapist;
  isEligible: boolean;
  status: 'optimal' | 'warning' | 'ineligible';
  score: number; // 0 to 100
  reasons: string[];
  blockers: string[];
  currentDailyHours: number;
  newDailyHours: number;
  interjornadaPrevHours: number | null;
  interjornadaNextHours: number | null;
}
