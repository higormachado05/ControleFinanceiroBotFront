import { RecentTransaction } from '../../features/dashboard/models/dashboard.models';
import { isReceita } from './format.utils';

export interface CategoryBreakdownItem {
  label: string;
  total: number;
  barPercent: number;
}

export function buildCategoryBreakdown(
  transactions: RecentTransaction[],
  mode: 'expense' | 'income',
  maxItems = 6,
): CategoryBreakdownItem[] {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    const isIncome = isReceita(transaction.tipo);
    if (mode === 'expense' && isIncome) {
      continue;
    }
    if (mode === 'income' && !isIncome) {
      continue;
    }

    const label = transaction.categoria?.trim() || 'Sem categoria';
    totals.set(label, (totals.get(label) ?? 0) + transaction.valor);
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxItems);
  const peak = sorted[0]?.[1] ?? 0;

  return sorted.map(([label, total]) => ({
    label,
    total,
    barPercent: peak > 0 ? Math.round((total / peak) * 100) : 0,
  }));
}
