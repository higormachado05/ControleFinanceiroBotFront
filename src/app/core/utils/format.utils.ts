const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function toDateInputValue(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseMoneyInput(raw: string): number | null {
  const normalized = raw
    .trim()
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  if (!normalized) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateFormatter.format(date);
}

export function isReceita(tipo: string): boolean {
  return tipo.toLowerCase().includes('receita');
}
