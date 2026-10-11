import { RecentTransaction } from '../../features/dashboard/models/dashboard.models';
import { formatCurrency, isReceita } from './format.utils';

export function transactionMeta(transaction: RecentTransaction): string {
  const parts: string[] = [];
  if (transaction.categoria) {
    parts.push(transaction.categoria);
  }
  if (transaction.usuario?.nome) {
    parts.push(transaction.usuario.nome);
  }
  return parts.join(' · ');
}

export function signedAmount(transaction: RecentTransaction): string {
  const prefix = isReceita(transaction.tipo) ? '+' : '−';
  return `${prefix}${formatCurrency(transaction.valor)}`;
}
