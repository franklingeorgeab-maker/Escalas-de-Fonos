export interface TherapistColorTheme {
  id: string;
  name: string;
  hex: string;
  avatarBg: string;
  avatarText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  leftBorder: string;
  headerBg: string;
  headerText: string;
  tagBg: string;
}

export const THERAPIST_COLOR_PALETTES: TherapistColorTheme[] = [
  {
    id: 'sky',
    name: 'Azul Celeste',
    hex: '#0284c7',
    avatarBg: 'bg-sky-600',
    avatarText: 'text-white',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    badgeBorder: 'border-sky-300',
    cardBorder: 'border-sky-200',
    leftBorder: 'border-l-4 border-l-sky-500',
    headerBg: 'bg-sky-50/80',
    headerText: 'text-sky-950',
    tagBg: 'bg-sky-500 text-white',
  },
  {
    id: 'teal',
    name: 'Verde Petróleo',
    hex: '#0d9488',
    avatarBg: 'bg-teal-600',
    avatarText: 'text-white',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900',
    badgeBorder: 'border-teal-300',
    cardBorder: 'border-teal-200',
    leftBorder: 'border-l-4 border-l-teal-500',
    headerBg: 'bg-teal-50/80',
    headerText: 'text-teal-950',
    tagBg: 'bg-teal-600 text-white',
  },
  {
    id: 'purple',
    name: 'Roxo Violeta',
    hex: '#7c3aed',
    avatarBg: 'bg-purple-600',
    avatarText: 'text-white',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
    cardBorder: 'border-purple-200',
    leftBorder: 'border-l-4 border-l-purple-500',
    headerBg: 'bg-purple-50/80',
    headerText: 'text-purple-950',
    tagBg: 'bg-purple-600 text-white',
  },
  {
    id: 'amber',
    name: 'Âmbar Dourado',
    hex: '#d97706',
    avatarBg: 'bg-amber-600',
    avatarText: 'text-white',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    cardBorder: 'border-amber-200',
    leftBorder: 'border-l-4 border-l-amber-500',
    headerBg: 'bg-amber-50/80',
    headerText: 'text-amber-950',
    tagBg: 'bg-amber-600 text-white',
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    hex: '#16a34a',
    avatarBg: 'bg-emerald-600',
    avatarText: 'text-white',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    cardBorder: 'border-emerald-200',
    leftBorder: 'border-l-4 border-l-emerald-500',
    headerBg: 'bg-emerald-50/80',
    headerText: 'text-emerald-950',
    tagBg: 'bg-emerald-600 text-white',
  },
  {
    id: 'rose',
    name: 'Rosa Coral',
    hex: '#e11d48',
    avatarBg: 'bg-rose-600',
    avatarText: 'text-white',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    cardBorder: 'border-rose-200',
    leftBorder: 'border-l-4 border-l-rose-500',
    headerBg: 'bg-rose-50/80',
    headerText: 'text-rose-950',
    tagBg: 'bg-rose-600 text-white',
  },
  {
    id: 'indigo',
    name: 'Índigo Real',
    hex: '#4f46e5',
    avatarBg: 'bg-indigo-600',
    avatarText: 'text-white',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-300',
    cardBorder: 'border-indigo-200',
    leftBorder: 'border-l-4 border-l-indigo-500',
    headerBg: 'bg-indigo-50/80',
    headerText: 'text-indigo-950',
    tagBg: 'bg-indigo-600 text-white',
  },
  {
    id: 'cyan',
    name: 'Turquesa Ciano',
    hex: '#0891b2',
    avatarBg: 'bg-cyan-600',
    avatarText: 'text-white',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-900',
    badgeBorder: 'border-cyan-300',
    cardBorder: 'border-cyan-200',
    leftBorder: 'border-l-4 border-l-cyan-500',
    headerBg: 'bg-cyan-50/80',
    headerText: 'text-cyan-950',
    tagBg: 'bg-cyan-600 text-white',
  },
  {
    id: 'orange',
    name: 'Laranja Ocupacional',
    hex: '#ea580c',
    avatarBg: 'bg-orange-600',
    avatarText: 'text-white',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300',
    cardBorder: 'border-orange-200',
    leftBorder: 'border-l-4 border-l-orange-500',
    headerBg: 'bg-orange-50/80',
    headerText: 'text-orange-950',
    tagBg: 'bg-orange-600 text-white',
  },
  {
    id: 'fuchsia',
    name: 'Fúcsia Magenta',
    hex: '#c026d3',
    avatarBg: 'bg-fuchsia-600',
    avatarText: 'text-white',
    badgeBg: 'bg-fuchsia-100',
    badgeText: 'text-fuchsia-900',
    badgeBorder: 'border-fuchsia-300',
    cardBorder: 'border-fuchsia-200',
    leftBorder: 'border-l-4 border-l-fuchsia-500',
    headerBg: 'bg-fuchsia-50/80',
    headerText: 'text-fuchsia-950',
    tagBg: 'bg-fuchsia-600 text-white',
  },
  {
    id: 'lime',
    name: 'Verde Lima',
    hex: '#65a30d',
    avatarBg: 'bg-lime-600',
    avatarText: 'text-white',
    badgeBg: 'bg-lime-100',
    badgeText: 'text-lime-900',
    badgeBorder: 'border-lime-300',
    cardBorder: 'border-lime-200',
    leftBorder: 'border-l-4 border-l-lime-500',
    headerBg: 'bg-lime-50/80',
    headerText: 'text-lime-950',
    tagBg: 'bg-lime-600 text-white',
  },
];

/**
 * Retorna o tema visual de cor de um profissional baseado no ID ou na cor HEX configurada.
 */
export function getTherapistColorTheme(therapistId: string, customHex?: string): TherapistColorTheme {
  if (customHex) {
    const matched = THERAPIST_COLOR_PALETTES.find(
      (p) => p.hex.toLowerCase() === customHex.toLowerCase()
    );
    if (matched) return matched;
  }

  // Gera um índice determinístico baseado no id do fonoaudiólogo
  let hash = 0;
  for (let i = 0; i < therapistId.length; i++) {
    hash = (hash << 5) - hash + therapistId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % THERAPIST_COLOR_PALETTES.length;
  return THERAPIST_COLOR_PALETTES[index];
}

/**
 * Cores temáticas para cada SEMANA DO MÊS.
 * A semana 1, 2, 3, 4, 5 do mês possuem identificadores visuais próprios.
 */
export interface WeekColorTheme {
  weekNumber: number;
  label: string;
  name: string;
  bannerBg: string;
  bannerBorder: string;
  bannerText: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
  subHeaderBg: string;
  containerBorder: string;
  ring: string;
}

export const WEEK_COLOR_THEMES: Record<number, WeekColorTheme> = {
  1: {
    weekNumber: 1,
    label: 'Semana 1',
    name: 'Azul Safira',
    bannerBg: 'bg-sky-50',
    bannerBorder: 'border-sky-200',
    bannerText: 'text-sky-900',
    badgeBg: 'bg-sky-600 text-white',
    badgeText: 'text-sky-700',
    accentBar: 'border-l-4 border-l-sky-500',
    subHeaderBg: 'bg-sky-100/50',
    containerBorder: 'border-sky-200 shadow-xs',
    ring: 'ring-sky-500',
  },
  2: {
    weekNumber: 2,
    label: 'Semana 2',
    name: 'Verde Esmeralda',
    bannerBg: 'bg-emerald-50',
    bannerBorder: 'border-emerald-200',
    bannerText: 'text-emerald-900',
    badgeBg: 'bg-emerald-600 text-white',
    badgeText: 'text-emerald-700',
    accentBar: 'border-l-4 border-l-emerald-500',
    subHeaderBg: 'bg-emerald-100/50',
    containerBorder: 'border-emerald-200 shadow-xs',
    ring: 'ring-emerald-500',
  },
  3: {
    weekNumber: 3,
    label: 'Semana 3',
    name: 'Âmbar Dourado',
    bannerBg: 'bg-amber-50',
    bannerBorder: 'border-amber-200',
    bannerText: 'text-amber-900',
    badgeBg: 'bg-amber-600 text-white',
    badgeText: 'text-amber-700',
    accentBar: 'border-l-4 border-l-amber-500',
    subHeaderBg: 'bg-amber-100/50',
    containerBorder: 'border-amber-200 shadow-xs',
    ring: 'ring-amber-500',
  },
  4: {
    weekNumber: 4,
    label: 'Semana 4',
    name: 'Violeta Real',
    bannerBg: 'bg-purple-50',
    bannerBorder: 'border-purple-200',
    bannerText: 'text-purple-900',
    badgeBg: 'bg-purple-600 text-white',
    badgeText: 'text-purple-700',
    accentBar: 'border-l-4 border-l-purple-500',
    subHeaderBg: 'bg-purple-100/50',
    containerBorder: 'border-purple-200 shadow-xs',
    ring: 'ring-purple-500',
  },
  5: {
    weekNumber: 5,
    label: 'Semana 5',
    name: 'Rosa Coral',
    bannerBg: 'bg-rose-50',
    bannerBorder: 'border-rose-200',
    bannerText: 'text-rose-900',
    badgeBg: 'bg-rose-600 text-white',
    badgeText: 'text-rose-700',
    accentBar: 'border-l-4 border-l-rose-500',
    subHeaderBg: 'bg-rose-100/50',
    containerBorder: 'border-rose-200 shadow-xs',
    ring: 'ring-rose-500',
  },
};

export function getWeekColorTheme(weekNumber: number): WeekColorTheme {
  const normalized = ((weekNumber - 1) % 5) + 1;
  return WEEK_COLOR_THEMES[normalized] || WEEK_COLOR_THEMES[1];
}
