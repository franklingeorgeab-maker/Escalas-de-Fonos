import { ShiftEntry, DailyCalculation } from '../types';

/**
 * Converte string "HH:mm" para minutos desde 00:00.
 */
export function timeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr || !timeStr.trim()) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Converte minutos desde 00:00 para "HH:mm".
 */
export function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formata minutos em string amigável de horas, ex: 8h30min ou 8h00
 */
export function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h00`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

/**
 * Calcula duração em minutos de um turno específico.
 */
export function getIntervalDurationMinutes(start?: string, end?: string): number {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (startMin === null || endMin === null) return 0;
  if (endMin <= startMin) return 0; // Turnos que viram a noite não são comuns em clínica, mas se houver tratamos
  return endMin - startMin;
}

/**
 * Extrai todos os intervalos de trabalho de um ShiftEntry em minutos [start, end].
 */
export function getActiveIntervals(shift: ShiftEntry): Array<{ start: number; end: number; period: 'manha' | 'tarde' | 'noite' }> {
  const intervals: Array<{ start: number; end: number; period: 'manha' | 'tarde' | 'noite' }> = [];

  const mStart = timeToMinutes(shift.morningStart);
  const mEnd = timeToMinutes(shift.morningEnd);
  if (mStart !== null && mEnd !== null && mEnd > mStart) {
    intervals.push({ start: mStart, end: mEnd, period: 'manha' });
  }

  const aStart = timeToMinutes(shift.afternoonStart);
  const aEnd = timeToMinutes(shift.afternoonEnd);
  if (aStart !== null && aEnd !== null && aEnd > aStart) {
    intervals.push({ start: aStart, end: aEnd, period: 'tarde' });
  }

  const nStart = timeToMinutes(shift.nightStart);
  const nEnd = timeToMinutes(shift.nightEnd);
  if (nStart !== null && nEnd !== null && nEnd > nStart) {
    intervals.push({ start: nStart, end: nEnd, period: 'noite' });
  }

  return intervals.sort((a, b) => a.start - b.start);
}

/**
 * Calcula totais do dia para um ShiftEntry.
 */
export function calculateShiftDuration(shift: ShiftEntry): {
  morningMinutes: number;
  afternoonMinutes: number;
  nightMinutes: number;
  totalMinutes: number;
  intrajornadaMinutes: number;
  firstStart: string | null;
  lastEnd: string | null;
} {
  const morningMinutes = getIntervalDurationMinutes(shift.morningStart, shift.morningEnd);
  const afternoonMinutes = getIntervalDurationMinutes(shift.afternoonStart, shift.afternoonEnd);
  const nightMinutes = getIntervalDurationMinutes(shift.nightStart, shift.nightEnd);
  const totalMinutes = morningMinutes + afternoonMinutes + nightMinutes;

  const intervals = getActiveIntervals(shift);
  let firstStart: string | null = null;
  let lastEnd: string | null = null;
  let intrajornadaMinutes = 0;

  if (intervals.length > 0) {
    firstStart = minutesToTime(intervals[0].start);
    lastEnd = minutesToTime(intervals[intervals.length - 1].end);

    // Calcula descanso entre os turnos no mesmo dia (ex: almoço entre manhã e tarde)
    for (let i = 0; i < intervals.length - 1; i++) {
      const rest = intervals[i + 1].start - intervals[i].end;
      if (rest > 0) {
        intrajornadaMinutes += rest;
      }
    }
  }

  return {
    morningMinutes,
    afternoonMinutes,
    nightMinutes,
    totalMinutes,
    intrajornadaMinutes,
    firstStart,
    lastEnd,
  };
}

/**
 * Calcula o descanso interjornada (em horas) entre o término do dia anterior
 * e o início do dia seguinte para um profissional.
 */
export function calculateInterjornadaRest(
  prevDayEndStr: string | null,
  nextDayStartStr: string | null
): number | null {
  if (!prevDayEndStr || !nextDayStartStr) return null;
  const prevEndMin = timeToMinutes(prevDayEndStr);
  const nextStartMin = timeToMinutes(nextDayStartStr);
  if (prevEndMin === null || nextStartMin === null) return null;

  // prevDay termina em prevEndMin (do dia 1)
  // nextDay começa em nextStartMin (do dia 2, que são + 1440 min adiante)
  const restMinutes = (1440 - prevEndMin) + nextStartMin;
  return +(restMinutes / 60).toFixed(2);
}

/**
 * Verifica se dois intervalos [start1, end1] e [start2, end2] se sobrepõem.
 */
export function areIntervalsOverlapping(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Adiciona ou subtrai dias de uma data ISO "YYYY-MM-DD"
 */
export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Obtém dias da semana (Segunda a Sexta ou Sábado) a partir de uma data de referência
 */
export function getWeekDates(referenceDateStr: string, includeSaturday = true): string[] {
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const current = new Date(Date.UTC(y, m - 1, d));
  // 0 = Domingo, 1 = Segunda ...
  const dayOfWeek = current.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(current);
  monday.setUTCDate(current.getUTCDate() + diffToMonday);

  const dates: string[] = [];
  const daysCount = includeSaturday ? 6 : 5;
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Formata data ISO para PT-BR "DD/MM/YYYY"
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formata data ISO para exibição com dia da semana, ex: "Seg, 10/11"
 */
export function formatDayWithWeekday(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayName = weekdays[date.getUTCDay()];
  return `${dayName}, ${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}`;
}

/**
 * Verifica se a data está no intervalo de uma ausência [startDate, endDate]
 */
export function isDateInAbsence(dateStr: string, startDate: string, endDate: string): boolean {
  return dateStr >= startDate && dateStr <= endDate;
}

/**
 * Retorna o nome por extenso do dia da semana (Segunda, Terça, Quarta, etc.)
 */
export function getWeekdayLabel(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return weekdays[date.getUTCDay()];
}

/**
 * Retorna o nome do mês e ano em português, ex: "Novembro 2026"
 */
export function getMonthNameAndYear(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-').map(Number);
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[m - 1]} de ${y}`;
}

/**
 * Adiciona ou subtrai meses de uma data
 */
export function shiftMonth(dateStr: string, monthsOffset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + monthsOffset, 1));
  const newY = date.getUTCFullYear();
  const newM = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const maxDay = new Date(Date.UTC(newY, date.getUTCMonth() + 1, 0)).getUTCDate();
  const newD = Math.min(d, maxDay).toString().padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
}

/**
 * Obtém todas as semanas de trabalho (Segunda a Sexta) de um determinado mês
 */
export function getWeeksOfMonth(dateStr: string): Array<{ weekNumber: number; days: string[] }> {
  const [y, m] = dateStr.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const weeks: Array<{ weekNumber: number; days: string[] }> = [];

  // Encontrar todas as segundas a sextas que caem ou tocam este mês
  let current = new Date(Date.UTC(y, m - 1, 1));
  // Ir para a primeira segunda-feira (pode ser no mês anterior)
  const firstDay = current.getUTCDay();
  const diffToMonday = firstDay === 0 ? -6 : 1 - firstDay;
  current.setUTCDate(current.getUTCDate() + diffToMonday);

  let weekCount = 1;
  while (true) {
    const weekDays: string[] = [];
    for (let i = 0; i < 5; i++) { // Segunda a Sexta
      const d = new Date(current);
      d.setUTCDate(current.getUTCDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }

    // Se pelo menos um dia da semana pertence ao mês, inclui
    const touchesMonth = weekDays.some((d) => {
      const parts = d.split('-').map(Number);
      return parts[0] === y && parts[1] === m;
    });

    if (touchesMonth) {
      weeks.push({ weekNumber: weekCount++, days: weekDays });
    }

    // Avança 7 dias
    current.setUTCDate(current.getUTCDate() + 7);
    // Se a próxima semana já for inteiramente do próximo mês, para
    const firstDayNext = current.toISOString().split('T')[0].split('-').map(Number);
    if (firstDayNext[0] > y || (firstDayNext[0] === y && firstDayNext[1] > m)) {
      break;
    }
  }

  return weeks;
}

