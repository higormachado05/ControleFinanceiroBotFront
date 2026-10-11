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
