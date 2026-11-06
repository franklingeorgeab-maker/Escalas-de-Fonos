import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Therapist,
  WorkUnit,
  ShiftEntry,
  Absence,
  ComplianceViolation,
  FixedSchedulePattern,
} from '../types';
import {
  INITIAL_THERAPISTS,
  INITIAL_UNITS,
  INITIAL_SHIFTS,
  INITIAL_ABSENCES,
  INITIAL_FIXED_PATTERNS,
} from '../data/mockData';
import { auditAllSchedules } from '../utils/complianceEngine';

interface ScheduleContextType {
  therapists: Therapist[];
  units: WorkUnit[];
  shifts: ShiftEntry[];
  absences: Absence[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedUnitFilter: string;
  setSelectedUnitFilter: (id: string) => void;
  selectedTherapistFilter: string;
  setSelectedTherapistFilter: (id: string) => void;
  violations: ComplianceViolation[];
  
  // Actions
  addShift: (shift: Omit<ShiftEntry, 'id'>) => void;
  updateShift: (id: string, updates: Partial<ShiftEntry>) => void;
  deleteShift: (id: string) => void;
  assignCoverage: (shiftId: string, substituteTherapistId: string, reason: string) => void;
  
  addAbsence: (absence: Omit<Absence, 'id' | 'createdAt'>) => void;
  deleteAbsence: (id: string) => void;
  
  addTherapist: (therapist: Omit<Therapist, 'id'>) => void;
  updateTherapist: (id: string, updates: Partial<Therapist>) => void;
  
  addUnit: (unit: Omit<WorkUnit, 'id'>) => void;
  updateUnit: (id: string, updates: Partial<WorkUnit>) => void;
  
  // Fixed Schedule Patterns per company
  fixedPatterns: FixedSchedulePattern[];
  addFixedPattern: (pattern: Omit<FixedSchedulePattern, 'id'>) => void;
  updateFixedPattern: (id: string, updates: Partial<FixedSchedulePattern>) => void;
  deleteFixedPattern: (id: string) => void;
  applyFixedPatternsToWeek: (weekDays: string[]) => void;

  importShifts: (newShifts: ShiftEntry[]) => void;
  resetToDefaults: () => void;
  
  // Quick Reallocation Modal state
  activeCoverageShift: ShiftEntry | null;
  openCoverageModal: (shift: ShiftEntry) => void;
  closeCoverageModal: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'fonoescala_v4_turnos_empresas_';

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedTherapistFilter, setSelectedTherapistFilter] = useState<string>('all');
  const [activeCoverageShift, setActiveCoverageShift] = useState<ShiftEntry | null>(null);

  // Carregar dados de localStorage com fallback para mocks limpos
  const [therapists, setTherapists] = useState<Therapist[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}therapists`);
      const list = saved ? JSON.parse(saved) : INITIAL_THERAPISTS;
      return list.map((t: Therapist) => ({
        ...t,
        name: t.name.replace(/^(Dr\.|Dra\.)\s*/i, ''),
        crfa: '',
      }));
    } catch {
      return INITIAL_THERAPISTS;
    }
  });

  const [units, setUnits] = useState<WorkUnit[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}units`);
      return saved ? JSON.parse(saved) : INITIAL_UNITS;
    } catch {
      return INITIAL_UNITS;
    }
  });

  const [shifts, setShifts] = useState<ShiftEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}shifts`);
      return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
    } catch {
      return INITIAL_SHIFTS;
    }
  });

  const [absences, setAbsences] = useState<Absence[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}absences`);
      return saved ? JSON.parse(saved) : INITIAL_ABSENCES;
    } catch {
      return INITIAL_ABSENCES;
    }
  });

  const [fixedPatterns, setFixedPatterns] = useState<FixedSchedulePattern[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}fixedPatterns`);
      return saved ? JSON.parse(saved) : INITIAL_FIXED_PATTERNS;
    } catch {
      return INITIAL_FIXED_PATTERNS;
    }
  });

  // Persistir em localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}therapists`, JSON.stringify(therapists));
    } catch (e) {
      console.error(e);
    }
  }, [therapists]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}units`, JSON.stringify(units));
    } catch (e) {
      console.error(e);
    }
  }, [units]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}shifts`, JSON.stringify(shifts));
    } catch (e) {
      console.error(e);
    }
  }, [shifts]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}absences`, JSON.stringify(absences));
    } catch (e) {
      console.error(e);
    }
  }, [absences]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}fixedPatterns`, JSON.stringify(fixedPatterns));
    } catch (e) {
      console.error(e);
    }
  }, [fixedPatterns]);

  // Auditoria em tempo real
  const violations = useMemo(() => {
    return auditAllSchedules(shifts, therapists, absences);
  }, [shifts, therapists, absences]);

  // Handlers
  const addShift = (shiftData: Omit<ShiftEntry, 'id'>) => {
    const newShift: ShiftEntry = {
      ...shiftData,
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setShifts((prev) => [newShift, ...prev]);
  };

  const updateShift = (id: string, updates: Partial<ShiftEntry>) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  const assignCoverage = (shiftId: string, substituteTherapistId: string, reason: string) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== shiftId) return s;
        return {
          ...s,
          therapistId: substituteTherapistId,
          isCoverage: true,
          coveringForTherapistId: s.therapistId || undefined,
          coverageReason: reason,
          isVacant: false,
        };
      })
    );
    setActiveCoverageShift(null);
  };

  const addAbsence = (absenceData: Omit<Absence, 'id' | 'createdAt'>) => {
    const newAbsence: Absence = {
      ...absenceData,
      id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setAbsences((prev) => [newAbsence, ...prev]);

    // Opcional: marca as escalas do período dessa fonoaudióloga como "isVacant: true"
    setShifts((prev) =>
      prev.map((s) => {
        if (
          s.therapistId === absenceData.therapistId &&
          s.date >= absenceData.startDate &&
          s.date <= absenceData.endDate
        ) {
          return {
            ...s,
            isVacant: true,
            notes: `${s.notes ? s.notes + ' | ' : ''}Ausência registrada (${absenceData.type})`,
          };
        }
        return s;
      })
    );
  };

  const deleteAbsence = (id: string) => {
    setAbsences((prev) => prev.filter((a) => a.id !== id));
  };

  const addTherapist = (data: Omit<Therapist, 'id'>) => {
    const newTherapist: Therapist = {
      ...data,
      id: `f_${Date.now()}`,
    };
    setTherapists((prev) => [...prev, newTherapist]);
  };

  const updateTherapist = (id: string, updates: Partial<Therapist>) => {
    setTherapists((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const addUnit = (data: Omit<WorkUnit, 'id'>) => {
    const newUnit: WorkUnit = {
      ...data,
      id: `u_${Date.now()}`,
    };
    setUnits((prev) => [...prev, newUnit]);
  };

  const updateUnit = (id: string, updates: Partial<WorkUnit>) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
  };

  const addFixedPattern = (pattern: Omit<FixedSchedulePattern, 'id'>) => {
    const newPattern: FixedSchedulePattern = {
      ...pattern,
      id: `fp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setFixedPatterns((prev) => [...prev, newPattern]);
  };

  const updateFixedPattern = (id: string, updates: Partial<FixedSchedulePattern>) => {
    setFixedPatterns((prev) =>
      prev.map((fp) => (fp.id === id ? { ...fp, ...updates } : fp))
    );
  };

  const deleteFixedPattern = (id: string) => {
    setFixedPatterns((prev) => prev.filter((fp) => fp.id !== id));
  };

  const applyFixedPatternsToWeek = (weekDays: string[]) => {
    setShifts((prev) => {
      let updated = [...prev];

      weekDays.forEach((dateStr, index) => {
        const weekdayNumber = (index + 1) as 1 | 2 | 3 | 4 | 5; // 1 = Segunda ... 5 = Sexta
        const dayPatterns = fixedPatterns.filter((fp) => fp.weekday === weekdayNumber);

        dayPatterns.forEach((pattern) => {
          const isVacation = absences.some(
            (a) =>
              a.therapistId === pattern.therapistId &&
              dateStr >= a.startDate &&
              dateStr <= a.endDate
          );

          const existingIndex = updated.findIndex(
            (s) => s.therapistId === pattern.therapistId && s.date === dateStr
          );

          const newShiftData: ShiftEntry = {
            id: existingIndex >= 0 ? updated[existingIndex].id : `sh_${Date.now()}_${pattern.id}_${dateStr}`,
            date: dateStr,
            therapistId: pattern.therapistId,
            unitId: pattern.morningUnitId || pattern.unitId,
            morningStart: pattern.morningStart,
            morningEnd: pattern.morningEnd,
            morningUnitId: pattern.morningUnitId || pattern.unitId,
            afternoonStart: pattern.afternoonStart,
            afternoonEnd: pattern.afternoonEnd,
            afternoonUnitId: pattern.afternoonUnitId || pattern.unitId,
            nightStart: pattern.nightStart,
            nightEnd: pattern.nightEnd,
            nightUnitId: pattern.nightUnitId || pattern.unitId,
            isCoverage: false,
            isVacant: isVacation,
            notes: isVacation ? 'Férias (Vaga Aberta)' : 'Escala fixa aplicada',
          };

          if (existingIndex >= 0) {
            updated[existingIndex] = newShiftData;
          } else {
            updated.push(newShiftData);
          }
        });
      });

      return updated;
    });
  };

  const importShifts = (newShifts: ShiftEntry[]) => {
    setShifts((prev) => [...newShifts, ...prev]);
  };

  const resetToDefaults = () => {
    setTherapists(INITIAL_THERAPISTS);
    setUnits(INITIAL_UNITS);
    setShifts(INITIAL_SHIFTS);
    setAbsences(INITIAL_ABSENCES);
    setFixedPatterns(INITIAL_FIXED_PATTERNS);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedUnitFilter('all');
    setSelectedTherapistFilter('all');
    setActiveCoverageShift(null);
  };

  const openCoverageModal = (shift: ShiftEntry) => {
    setActiveCoverageShift(shift);
  };

  const closeCoverageModal = () => {
    setActiveCoverageShift(null);
  };

  return (
    <ScheduleContext.Provider
      value={{
        therapists,
        units,
        shifts,
        absences,
        selectedDate,
        setSelectedDate,
        selectedUnitFilter,
        setSelectedUnitFilter,
        selectedTherapistFilter,
        setSelectedTherapistFilter,
        violations,
        addShift,
        updateShift,
        deleteShift,
        assignCoverage,
        addAbsence,
        deleteAbsence,
        addTherapist,
        updateTherapist,
        addUnit,
        updateUnit,
        fixedPatterns,
        addFixedPattern,
        updateFixedPattern,
        deleteFixedPattern,
        applyFixedPatternsToWeek,
        importShifts,
        resetToDefaults,
        activeCoverageShift,
        openCoverageModal,
        closeCoverageModal,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
