export interface DashboardSummary {
  saldo: number;
  receitas: number;
  gastos: number;
  quantidadeTransacoes: number;
}

export interface DashboardTransactionUser {
  id: string;
  nome: string;
}

export interface RecentTransaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  categoria?: string;
  usuario?: DashboardTransactionUser;
}
