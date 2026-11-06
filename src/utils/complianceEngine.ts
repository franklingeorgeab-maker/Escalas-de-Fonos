import {
  ShiftEntry,
  Therapist,
  Absence,
  ComplianceViolation,
  CandidateAvailability,
  DailyCalculation,
} from '../types';
import {
  calculateShiftDuration,
  calculateInterjornadaRest,
  getActiveIntervals,
  areIntervalsOverlapping,
  shiftDate,
  formatMinutesToHours,
  timeToMinutes,
  minutesToTime,
} from './timeCalculations';

export const MAX_DAILY_HOURS_LEGAL = 10; // Limite legal diário com horas extras
export const MIN_INTERJORNADA_HOURS_LEGAL = 12; // Mínimo de 12 horas consecutivas de descanso

/**
 * Agrupa turnos por terapeuta e data para auditoria unificada.
 */
export function groupShiftsByTherapistAndDate(shifts: ShiftEntry[]): Map<string, ShiftEntry[]> {
  const map = new Map<string, ShiftEntry[]>();
  for (const shift of shifts) {
    if (!shift.therapistId || shift.isVacant) continue;
    const key = `${shift.therapistId}_${shift.date}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(shift);
  }
  return map;
}

/**
 * Calcula o resumo consolidado de um dia para um fonoaudiólogo
 */
export function getTherapistDailyMetrics(
  therapistId: string,
  date: string,
  allShifts: ShiftEntry[]
): {
  totalMinutes: number;
  totalHours: number;
  firstStart: string | null;
  lastEnd: string | null;
  shifts: ShiftEntry[];
} {
  const dayShifts = allShifts.filter(
    (s) => s.therapistId === therapistId && s.date === date && !s.isVacant
  );

  let totalMinutes = 0;
  let minStartVal: number | null = null;
  let maxEndVal: number | null = null;
  let firstStart: string | null = null;
  let lastEnd: string | null = null;

  for (const shift of dayShifts) {
    const calc = calculateShiftDuration(shift);
    totalMinutes += calc.totalMinutes;

    const intervals = getActiveIntervals(shift);
    for (const iv of intervals) {
      if (minStartVal === null || iv.start < minStartVal) {
        minStartVal = iv.start;
        firstStart = shift.morningStart || shift.afternoonStart || shift.nightStart || null;
      }
      if (maxEndVal === null || iv.end > maxEndVal) {
        maxEndVal = iv.end;
        lastEnd = shift.nightEnd || shift.afternoonEnd || shift.morningEnd || null;
      }
    }
  }

  return {
    totalMinutes,
    totalHours: +(totalMinutes / 60).toFixed(2),
    firstStart,
    lastEnd,
    shifts: dayShifts,
  };
}

/**
 * Audita todas as escalas em busca de violações de CLT, 10h diárias, 12h de interjornada,
 * sobreposição e ausências.
 */
export function auditAllSchedules(
  shifts: ShiftEntry[],
  therapists: Therapist[],
  absences: Absence[]
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const therapistMap = new Map(therapists.map((t) => [t.id, t]));

  // 1. Verificar conflito com Afastamentos / Férias / Licença de Saúde
  for (const shift of shifts) {
    if (!shift.therapistId || shift.isVacant) continue;
    const therapist = therapistMap.get(shift.therapistId);
    const therapistName = therapist ? therapist.name : 'Profissional';

    const activeAbsence = absences.find(
      (a) => a.therapistId === shift.therapistId && shift.date >= a.startDate && shift.date <= a.endDate
    );

    if (activeAbsence) {
      const typeLabel =
        activeAbsence.type === 'ferias'
          ? 'Férias'
          : activeAbsence.type === 'licenca_saude'
          ? 'Licença de Saúde'
          : activeAbsence.type === 'atestado'
          ? 'Atestado Médico'
          : activeAbsence.type === 'capacitacao'
          ? 'Capacitação Externa'
          : 'Folga Compensatória';

      violations.push({
        id: `abs_${shift.id}`,
        shiftId: shift.id,
        therapistId: shift.therapistId,
        therapistName,
        date: shift.date,
        rule: 'ABSENCE_COLLISION',
        severity: 'error',
        title: `Alocação durante ${typeLabel}`,
        description: `${therapistName} está registrado(a) em ${typeLabel} (${activeAbsence.reason}) de ${activeAbsence.startDate} a ${activeAbsence.endDate}, mas possui escala ativa nesta data.`,
        recommendation: `Realocar ou atribuir substituto para o atendimento da data ${shift.date}.`,
      });
    }
  }

  // 2. Verificar sobreposição no mesmo dia para o mesmo terapeuta em unidades diferentes ou mesmos horários
  const grouped = groupShiftsByTherapistAndDate(shifts);

  grouped.forEach((dayShifts, key) => {
    const [therapistId, date] = key.split('_');
    const therapist = therapistMap.get(therapistId);
    const therapistName = therapist ? therapist.name : 'Profissional';

    // A) Checar sobreposição direta entre múltiplos registros no mesmo dia
    if (dayShifts.length > 1) {
      for (let i = 0; i < dayShifts.length; i++) {
        const intervalsA = getActiveIntervals(dayShifts[i]);
        for (let j = i + 1; j < dayShifts.length; j++) {
          const intervalsB = getActiveIntervals(dayShifts[j]);
          for (const a of intervalsA) {
            for (const b of intervalsB) {
              if (areIntervalsOverlapping(a.start, a.end, b.start, b.end)) {
                violations.push({
                  id: `overlap_${dayShifts[i].id}_${dayShifts[j].id}`,
                  shiftId: dayShifts[i].id,
                  therapistId,
                  therapistName,
                  date,
                  rule: 'TIME_OVERLAP',
                  severity: 'error',
                  title: 'Conflito de Horário (Sobreposição)',
                  description: `${therapistName} tem dois turnos simultâneos cadastrados na mesma data em unidades distintas.`,
                  recommendation: 'Ajuste os horários de início e fim ou remaneje um dos turnos para outro fonoaudiólogo.',
                });
              }
            }
          }
        }
      }
    }

    // B) Checar Teto Diário de 10 Horas (CLT Art. 59)
    let totalDayMinutes = 0;
    let intervalsAllDay: Array<{ start: number; end: number }> = [];

    for (const s of dayShifts) {
      const calc = calculateShiftDuration(s);
      totalDayMinutes += calc.totalMinutes;
      intervalsAllDay.push(...getActiveIntervals(s));
    }

    const totalDayHours = +(totalDayMinutes / 60).toFixed(2);
    if (totalDayHours > MAX_DAILY_HOURS_LEGAL) {
      violations.push({
        id: `max10_${therapistId}_${date}`,
        therapistId,
        therapistName,
        date,
        rule: 'MAX_10_HOURS',
        severity: 'error',
        title: `Excesso de Carga Horária Diária (${formatMinutesToHours(totalDayMinutes)})`,
        description: `${therapistName} está escalado(a) para ${formatMinutesToHours(totalDayMinutes)} no dia ${date}, excedendo o limite máximo legal de 10 horas diárias (CLT Art. 59).`,
        recommendation: `Reduza a jornada do dia ou transfira parte dos horários (manhã, tarde ou noite) para outro profissional.`,
      });
    } else if (totalDayHours > 8.5) {
      violations.push({
        id: `warn8_${therapistId}_${date}`,
        therapistId,
        therapistName,
        date,
        rule: 'MAX_10_HOURS',
        severity: 'warning',
        title: `Jornada Estendida (${formatMinutesToHours(totalDayMinutes)})`,
        description: `${therapistName} está cumprindo ${formatMinutesToHours(totalDayMinutes)} neste dia (dentro do teto de 10h, porém com horas extras).`,
        recommendation: 'Verifique se há autorização de horas extras e compensação futura.',
      });
    }

    // C) Checar Intervalo Intrajornada (Almoço/Repouso de no mínimo 1 hora se jornada > 6h)
    if (totalDayHours > 6) {
      intervalsAllDay.sort((a, b) => a.start - b.start);
      let maxPauseMinutes = 0;
      for (let i = 0; i < intervalsAllDay.length - 1; i++) {
        const pause = intervalsAllDay[i + 1].start - intervalsAllDay[i].end;
        if (pause > maxPauseMinutes) maxPauseMinutes = pause;
      }

      if (maxPauseMinutes < 60) {
        violations.push({
          id: `intrajornada_${therapistId}_${date}`,
          therapistId,
          therapistName,
          date,
          rule: 'INTRAJORNADA_INTERVAL',
          severity: 'warning',
          title: 'Intervalo Intrajornada Insuficiente',
          description: `${therapistName} possui jornada superior a 6 horas (${formatMinutesToHours(totalDayMinutes)}), mas o intervalo de repouso/almoço é de apenas ${maxPauseMinutes} minutos (mínimo legal: 60 minutos).`,
          recommendation: 'Garanta no mínimo 1 hora entre o fim do turno da manhã e o início da tarde.',
        });
      }
    }
  });

  // 3. Checar Intervalo Interjornada de 12 horas consecutivas (CLT Art. 66 / Regra de Saúde)
  // Para cada par de dias consecutivos (D e D+1) de um mesmo terapeuta:
  for (const therapist of therapists) {
    const therapistShifts = shifts.filter(
      (s) => s.therapistId === therapist.id && !s.isVacant
    );
    // Ordenar por data
    const distinctDates = Array.from(new Set(therapistShifts.map((s) => s.date))).sort();

    for (let k = 0; k < distinctDates.length; k++) {
      const currentDate = distinctDates[k];
      const nextDate = shiftDate(currentDate, 1);

      if (distinctDates.includes(nextDate)) {
        const currentMetrics = getTherapistDailyMetrics(therapist.id, currentDate, therapistShifts);
        const nextMetrics = getTherapistDailyMetrics(therapist.id, nextDate, therapistShifts);

        if (currentMetrics.lastEnd && nextMetrics.firstStart) {
          const restHours = calculateInterjornadaRest(currentMetrics.lastEnd, nextMetrics.firstStart);

          if (restHours !== null && restHours < MIN_INTERJORNADA_HOURS_LEGAL) {
            violations.push({
              id: `interjornada_${therapist.id}_${currentDate}_${nextDate}`,
              therapistId: therapist.id,
              therapistName: therapist.name,
              date: nextDate,
              rule: 'MIN_12_HOURS_INTERJORNADA',
              severity: 'error',
              title: `Descanso Interjornada Violado (${restHours}h de intervalo)`,
              description: `${therapist.name} encerra o expediente às ${currentMetrics.lastEnd} (${currentDate}) e inicia às ${nextMetrics.firstStart} (${nextDate}), totalizando apenas ${restHours} horas de repouso. O intervalo mínimo obrigatório é de 12 horas consecutivas.`,
              recommendation: `Adie o início da escala no dia ${nextDate} para após ${minutesToTime((timeToMinutes(currentMetrics.lastEnd)! + 720) % 1440)} ou aloque outro profissional na manhã.`,
            });
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Motor de Sugestão e Busca Rápida de Substitutos / Disponibilidade:
 * Avalia todos os profissionais cadastrados para cobrir um turno específico
 * e classifica-os em Ótimos, Com Ressalva ou Inelegíveis (com motivos detalhados).
 */
export function findAvailableCandidatesForSlot(
  targetDate: string,
  targetShiftTimes: {
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
    nightStart?: string;
    nightEnd?: string;
  },
  unitId: string,
  therapists: Therapist[],
  allShifts: ShiftEntry[],
  absences: Absence[],
  excludeTherapistId?: string
): CandidateAvailability[] {
  const dummyShift: ShiftEntry = {
    id: 'simulated_slot',
    date: targetDate,
    therapistId: '',
    unitId,
    morningStart: targetShiftTimes.morningStart || '',
    morningEnd: targetShiftTimes.morningEnd || '',
    afternoonStart: targetShiftTimes.afternoonStart || '',
    afternoonEnd: targetShiftTimes.afternoonEnd || '',
    nightStart: targetShiftTimes.nightStart || '',
    nightEnd: targetShiftTimes.nightEnd || '',
    isCoverage: true,
  };

  const slotIntervals = getActiveIntervals(dummyShift);
  const slotDuration = calculateShiftDuration(dummyShift);
  const slotMinutes = slotDuration.totalMinutes;

  const results: CandidateAvailability[] = [];

  for (const therapist of therapists) {
    if (!therapist.active) continue;
    if (excludeTherapistId && therapist.id === excludeTherapistId) continue;

    const reasons: string[] = [];
    const blockers: string[] = [];

    // 1. Checar se está de férias, licença de saúde, atestado
    const absence = absences.find(
      (a) => a.therapistId === therapist.id && targetDate >= a.startDate && targetDate <= a.endDate
    );

    if (absence) {
      const typeDesc =
        absence.type === 'ferias'
          ? 'Férias programadas'
          : absence.type === 'licenca_saude'
          ? 'Licença de Saúde'
          : absence.type === 'atestado'
          ? 'Atestado Médico'
          : absence.type === 'capacitacao'
          ? 'Capacitação Externa'
          : 'Folga Compensatória';
      blockers.push(`Em afastamento: ${typeDesc} (${absence.reason || 'Sem observação'})`);
    }

    // 2. Checar turnos existentes na data
    const existingDayShifts = allShifts.filter(
      (s) => s.therapistId === therapist.id && s.date === targetDate && !s.isVacant
    );

    let currentDayMinutes = 0;
    let hasDirectOverlap = false;

    for (const s of existingDayShifts) {
      const dur = calculateShiftDuration(s);
      currentDayMinutes += dur.totalMinutes;

      const existingIntervals = getActiveIntervals(s);
      for (const slotIv of slotIntervals) {
        for (const existIv of existingIntervals) {
          if (areIntervalsOverlapping(slotIv.start, slotIv.end, existIv.start, existIv.end)) {
            hasDirectOverlap = true;
            blockers.push(
              `Já possui atendimento no horário (${minutesToTime(existIv.start)} - ${minutesToTime(existIv.end)})`
            );
          }
        }
      }
    }

    const projectedDayMinutes = currentDayMinutes + slotMinutes;
    const projectedDayHours = +(projectedDayMinutes / 60).toFixed(2);
    const currentDayHours = +(currentDayMinutes / 60).toFixed(2);

    // 3. Checar teto de 10 horas diárias
    if (projectedDayHours > MAX_DAILY_HOURS_LEGAL) {
      blockers.push(
        `Excederia o limite de 10h diárias: totalizaria ${formatMinutesToHours(projectedDayMinutes)} no dia`
      );
    }

    // 4. Checar descanso interjornada de 12 horas com o dia anterior (D-1)
    const prevDate = shiftDate(targetDate, -1);
    const prevMetrics = getTherapistDailyMetrics(therapist.id, prevDate, allShifts);
    let interjornadaPrevHours: number | null = null;

    if (prevMetrics.lastEnd && slotDuration.firstStart) {
      interjornadaPrevHours = calculateInterjornadaRest(prevMetrics.lastEnd, slotDuration.firstStart);
      if (interjornadaPrevHours !== null && interjornadaPrevHours < MIN_INTERJORNADA_HOURS_LEGAL) {
        blockers.push(
          `Intervalo interjornada insuficiente com o dia anterior: apenas ${interjornadaPrevHours}h de descanso (saiu às ${prevMetrics.lastEnd} do dia ${prevDate})`
        );
      }
    }

    // 5. Checar descanso interjornada de 12 horas com o dia seguinte (D+1)
    const nextDate = shiftDate(targetDate, 1);
    const nextMetrics = getTherapistDailyMetrics(therapist.id, nextDate, allShifts);
    let interjornadaNextHours: number | null = null;

    if (slotDuration.lastEnd && nextMetrics.firstStart) {
      interjornadaNextHours = calculateInterjornadaRest(slotDuration.lastEnd, nextMetrics.firstStart);
      if (interjornadaNextHours !== null && interjornadaNextHours < MIN_INTERJORNADA_HOURS_LEGAL) {
        blockers.push(
          `Intervalo interjornada insuficiente com o dia seguinte: apenas ${interjornadaNextHours}h de descanso (entrará às ${nextMetrics.firstStart} em ${nextDate})`
        );
      }
    }

    // 6. Pontos positivos e score de aptidão
    let score = 100;

    if (blockers.length > 0) {
      score = 0;
    } else {
      if (therapist.defaultUnitId === unitId) {
        reasons.push('Unidade de atuação habitual do profissional (sem necessidade de deslocamento)');
        score += 15;
      }

      if (currentDayMinutes === 0) {
        reasons.push('Dia totalmente livre na escala (disponibilidade integral)');
        score += 20;
      } else {
        reasons.push(
          `Já possui ${formatMinutesToHours(currentDayMinutes)} alocados hoje; ficará com ${formatMinutesToHours(projectedDayMinutes)} (dentro do limite)`
        );
      }

      if (interjornadaPrevHours !== null && interjornadaPrevHours >= MIN_INTERJORNADA_HOURS_LEGAL) {
        reasons.push(`Intervalo interjornada de descanso regular: ${interjornadaPrevHours}h de repouso`);
      }

      if (projectedDayHours >= 8.5 && projectedDayHours <= 10) {
        reasons.push(`Atenção: jornada estendida de ${formatMinutesToHours(projectedDayMinutes)}.`);
        score -= 10;
      }
    }

    const isEligible = blockers.length === 0;
    const status = !isEligible ? 'ineligible' : projectedDayHours > 8.5 ? 'warning' : 'optimal';

    results.push({
      therapist,
      isEligible,
      status,
      score: Math.max(0, score),
      reasons,
      blockers,
      currentDailyHours: currentDayHours,
      newDailyHours: projectedDayHours,
      interjornadaPrevHours,
      interjornadaNextHours,
    });
  }

  // Ordenar: primeiro os elegíveis com maior score
  return results.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.score - a.score;
  });
}
