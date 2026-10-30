export interface MonthPeriod {
  year: number;
  month: number;
}

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

export function currentMonthPeriod(now = new Date()): MonthPeriod {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
}

export function toMonthInputValue(period: MonthPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

export function shiftMonthPeriod(period: MonthPeriod, deltaMonths: number): MonthPeriod {
  const anchor = new Date(Date.UTC(period.year, period.month - 1 + deltaMonths, 1));
  return { year: anchor.getUTCFullYear(), month: anchor.getUTCMonth() + 1 };
}

export function parseMonthInputValue(value: string): MonthPeriod | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

export function isSameMonth(left: MonthPeriod, right: MonthPeriod): boolean {
  return left.year === right.year && left.month === right.month;
}

export function isAfterMonth(left: MonthPeriod, right: MonthPeriod): boolean {
  return left.year > right.year || (left.year === right.year && left.month > right.month);
}

export const MIN_CYCLE_START_DAY = 1;
export const MAX_CYCLE_START_DAY = 28;

export function normalizeCycleStartDay(value: number | undefined): number {
  if (!value || value < MIN_CYCLE_START_DAY) {
    return MIN_CYCLE_START_DAY;
  }
  if (value > MAX_CYCLE_START_DAY) {
    return MAX_CYCLE_START_DAY;
  }
  return value;
}

export function brazilLocalDateParts(now = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  };
}

export function currentReferencePeriod(cycleStartDay: number, now = new Date()): MonthPeriod {
  const cycleDay = normalizeCycleStartDay(cycleStartDay);
  if (cycleDay === 1) {
    return currentMonthPeriod(now);
  }

  const local = brazilLocalDateParts(now);
  if (local.day >= cycleDay) {
    return { year: local.year, month: local.month };
  }

  const previous = new Date(Date.UTC(local.year, local.month - 1, 1));
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  return { year: previous.getUTCFullYear(), month: previous.getUTCMonth() + 1 };
}

export function formatPeriodRangeLabel(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (!start || !end) {
    return '';
  }

  const startFmt = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(start);
  const endFmt = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(end);

  return `${startFmt} – ${endFmt}`;
}

export function formatPeriodDisplay(options: {
  year: number;
  month: number;
  diaInicioCiclo?: number;
  periodoInicio?: string;
  periodoFim?: string;
}): string {
  const cycleDay = normalizeCycleStartDay(options.diaInicioCiclo);
  if (cycleDay !== 1 && options.periodoInicio && options.periodoFim) {
    return formatPeriodRangeLabel(options.periodoInicio, options.periodoFim);
  }
  return formatMonthLabel(options.year, options.month);
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function formatMonthLabel(year: number, month: number): string {
  if (!year || month < 1 || month > 12) {
    const current = currentMonthPeriod();
    year = current.year;
    month = current.month;
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
