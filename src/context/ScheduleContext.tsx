import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
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
import { db, testConnection, handleFirestoreError, OperationType } from '../firebase';

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
  isDatabaseConnected: boolean;

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

const STORAGE_KEY_PREFIX = 'fonoescala_v5_firestore_';

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedTherapistFilter, setSelectedTherapistFilter] = useState<string>('all');
  const [activeCoverageShift, setActiveCoverageShift] = useState<ShiftEntry | null>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(true);

  // Inicializa estado local a partir do cache ou fallback inicial
  const [therapists, setTherapists] = useState<Therapist[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}therapists`);
      return saved ? JSON.parse(saved) : INITIAL_THERAPISTS;
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

  // Teste de conexão no boot conforme diretrizes do Firebase
  useEffect(() => {
    testConnection();
  }, []);

  // 1. Sincronização em tempo real com Firestore: Therapists
  useEffect(() => {
    const colRef = collection(db, 'therapists');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => docSnap.data() as Therapist);
          setTherapists(list);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}therapists`, JSON.stringify(list));
        } else {
          // Se banco vazio, popula os 8 colaboradores iniciais
          INITIAL_THERAPISTS.forEach((t) => {
            setDoc(doc(db, 'therapists', t.id), t).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, 'therapists')
            );
          });
        }
      },
      (error) => {
        console.warn('Firestore offline fallback for therapists:', error);
        setIsDatabaseConnected(false);
      }
    );
    return () => unsub();
  }, []);

  // 2. Sincronização em tempo real com Firestore: Units (Empresas)
  useEffect(() => {
    const colRef = collection(db, 'units');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => docSnap.data() as WorkUnit);
          setUnits(list);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}units`, JSON.stringify(list));
        } else {
          // Se banco vazio, popula as 9 empresas iniciais
          INITIAL_UNITS.forEach((u) => {
            setDoc(doc(db, 'units', u.id), u).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, 'units')
            );
          });
        }
      },
      (error) => {
        console.warn('Firestore offline fallback for units:', error);
        setIsDatabaseConnected(false);
      }
    );
    return () => unsub();
  }, []);

  // 3. Sincronização em tempo real com Firestore: Shifts (Escalas)
  useEffect(() => {
    const colRef = collection(db, 'shifts');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => docSnap.data() as ShiftEntry);
          setShifts(list);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}shifts`, JSON.stringify(list));
        } else {
          // Se banco vazio, popula escalas iniciais
          INITIAL_SHIFTS.forEach((s) => {
            setDoc(doc(db, 'shifts', s.id), s).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, 'shifts')
            );
          });
        }
      },
      (error) => {
        console.warn('Firestore offline fallback for shifts:', error);
        setIsDatabaseConnected(false);
      }
    );
    return () => unsub();
  }, []);

  // 4. Sincronização em tempo real com Firestore: Absences (Férias)
  useEffect(() => {
    const colRef = collection(db, 'absences');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => docSnap.data() as Absence);
          setAbsences(list);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}absences`, JSON.stringify(list));
        } else {
          INITIAL_ABSENCES.forEach((a) => {
            setDoc(doc(db, 'absences', a.id), a).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, 'absences')
            );
          });
        }
      },
      (error) => {
        console.warn('Firestore offline fallback for absences:', error);
        setIsDatabaseConnected(false);
      }
    );
    return () => unsub();
  }, []);

  // 5. Sincronização em tempo real com Firestore: Fixed Patterns (Escalas Fixas)
  useEffect(() => {
    const colRef = collection(db, 'fixedPatterns');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((docSnap) => docSnap.data() as FixedSchedulePattern);
          setFixedPatterns(list);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}fixedPatterns`, JSON.stringify(list));
        } else {
          INITIAL_FIXED_PATTERNS.forEach((fp) => {
            setDoc(doc(db, 'fixedPatterns', fp.id), fp).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, 'fixedPatterns')
            );
          });
        }
      },
      (error) => {
        console.warn('Firestore offline fallback for fixedPatterns:', error);
        setIsDatabaseConnected(false);
      }
    );
    return () => unsub();
  }, []);

  // Auditoria em tempo real
  const violations = useMemo(() => {
    return auditAllSchedules(shifts, therapists, absences);
  }, [shifts, therapists, absences]);

  // Handlers sincronizados com o Firestore
  const addShift = async (shiftData: Omit<ShiftEntry, 'id'>) => {
    const newShift: ShiftEntry = {
      ...shiftData,
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setShifts((prev) => [newShift, ...prev]);

    try {
      await setDoc(doc(db, 'shifts', newShift.id), newShift);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `shifts/${newShift.id}`);
    }
  };

  const updateShift = async (id: string, updates: Partial<ShiftEntry>) => {
    let updatedShift: ShiftEntry | null = null;
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          updatedShift = { ...s, ...updates };
          return updatedShift;
        }
        return s;
      })
    );

    if (updatedShift) {
      try {
        await setDoc(doc(db, 'shifts', id), updatedShift);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `shifts/${id}`);
      }
    }
  };

  const deleteShift = async (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'shifts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shifts/${id}`);
    }
  };

  const assignCoverage = async (shiftId: string, substituteTherapistId: string, reason: string) => {
    let updatedShift: ShiftEntry | null = null;
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== shiftId) return s;
        updatedShift = {
          ...s,
          therapistId: substituteTherapistId,
          isCoverage: true,
          coveringForTherapistId: s.therapistId || undefined,
          coverageReason: reason,
          isVacant: false,
        };
        return updatedShift;
      })
    );
    setActiveCoverageShift(null);

    if (updatedShift) {
      try {
        await setDoc(doc(db, 'shifts', shiftId), updatedShift);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `shifts/${shiftId}`);
      }
    }
  };

  const addAbsence = async (absenceData: Omit<Absence, 'id' | 'createdAt'>) => {
    const newAbsence: Absence = {
      ...absenceData,
      id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setAbsences((prev) => [newAbsence, ...prev]);

    try {
      await setDoc(doc(db, 'absences', newAbsence.id), newAbsence);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `absences/${newAbsence.id}`);
    }

    // Marca as escalas do período dessa fonoaudióloga como "isVacant: true"
    shifts.forEach((s) => {
      if (
        s.therapistId === absenceData.therapistId &&
        s.date >= absenceData.startDate &&
        s.date <= absenceData.endDate
      ) {
        updateShift(s.id, {
          isVacant: true,
          notes: `${s.notes ? s.notes + ' | ' : ''}Ausência registrada (${absenceData.type})`,
        });
      }
    });
  };

  const deleteAbsence = async (id: string) => {
    setAbsences((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteDoc(doc(db, 'absences', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `absences/${id}`);
    }
  };

  const addTherapist = async (data: Omit<Therapist, 'id'>) => {
    const newTherapist: Therapist = {
      ...data,
      id: `f_${Date.now()}`,
    };
    setTherapists((prev) => [...prev, newTherapist]);

    try {
      await setDoc(doc(db, 'therapists', newTherapist.id), newTherapist);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `therapists/${newTherapist.id}`);
    }
  };

  const updateTherapist = async (id: string, updates: Partial<Therapist>) => {
    let updatedItem: Therapist | null = null;
    setTherapists((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          updatedItem = { ...t, ...updates };
          return updatedItem;
        }
        return t;
      })
    );

    if (updatedItem) {
      try {
        await setDoc(doc(db, 'therapists', id), updatedItem);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `therapists/${id}`);
      }
    }
  };

  const addUnit = async (data: Omit<WorkUnit, 'id'>) => {
    const newUnit: WorkUnit = {
      ...data,
      id: `u_${Date.now()}`,
    };
    setUnits((prev) => [...prev, newUnit]);

    try {
      await setDoc(doc(db, 'units', newUnit.id), newUnit);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `units/${newUnit.id}`);
    }
  };

  const updateUnit = async (id: string, updates: Partial<WorkUnit>) => {
    let updatedItem: WorkUnit | null = null;
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          updatedItem = { ...u, ...updates };
          return updatedItem;
        }
        return u;
      })
    );

    if (updatedItem) {
      try {
        await setDoc(doc(db, 'units', id), updatedItem);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `units/${id}`);
      }
    }
  };

  const addFixedPattern = async (pattern: Omit<FixedSchedulePattern, 'id'>) => {
    const newPattern: FixedSchedulePattern = {
      ...pattern,
      id: `fp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setFixedPatterns((prev) => [...prev, newPattern]);

    try {
      await setDoc(doc(db, 'fixedPatterns', newPattern.id), newPattern);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `fixedPatterns/${newPattern.id}`);
    }
  };

  const updateFixedPattern = async (id: string, updates: Partial<FixedSchedulePattern>) => {
    let updatedItem: FixedSchedulePattern | null = null;
    setFixedPatterns((prev) =>
      prev.map((fp) => {
        if (fp.id === id) {
          updatedItem = { ...fp, ...updates };
          return updatedItem;
        }
        return fp;
      })
    );

    if (updatedItem) {
      try {
        await setDoc(doc(db, 'fixedPatterns', id), updatedItem);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `fixedPatterns/${id}`);
      }
    }
  };

  const deleteFixedPattern = async (id: string) => {
    setFixedPatterns((prev) => prev.filter((fp) => fp.id !== id));
    try {
      await deleteDoc(doc(db, 'fixedPatterns', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `fixedPatterns/${id}`);
    }
  };

  const applyFixedPatternsToWeek = (weekDays: string[]) => {
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

        const existingShift = shifts.find(
          (s) => s.therapistId === pattern.therapistId && s.date === dateStr
        );

        const newShiftData: ShiftEntry = {
          id: existingShift ? existingShift.id : `sh_${Date.now()}_${pattern.id}_${dateStr}`,
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

        if (existingShift) {
          updateShift(existingShift.id, newShiftData);
        } else {
          addShift(newShiftData);
        }
      });
    });
  };

  const importShifts = (newShifts: ShiftEntry[]) => {
    newShifts.forEach((s) => addShift(s));
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
        isDatabaseConnected,
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
