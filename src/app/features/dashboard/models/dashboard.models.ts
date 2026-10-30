export interface DashboardSummary {
  saldo: number;
  receitas: number;
  gastos: number;
  quantidadeTransacoes: number;
  ano: number;
  mes: number;
  diaInicioCiclo?: number;
  periodoInicio?: string;
  periodoFim?: string;
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
