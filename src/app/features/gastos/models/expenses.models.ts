export type ExpenseAccountScope = 'all' | 'personal' | 'joint';

export interface ExpenseAccountContext {
  id: string;
  tipo: string;
  rotulo: string;
}

export interface ExpenseUser {
  id: string;
  nome: string;
}

export interface ExpenseListItem {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
  conta: ExpenseAccountContext;
  responsavel: ExpenseUser;
}

export interface ExpensesListResponse {
  totalGastos: number;
  quantidade: number;
  itens: ExpenseListItem[];
}

export interface ExpenseMemberOption {
  id: string;
  nome: string;
  ehUsuarioAtual: boolean;
}

export interface ExpensesFilterOptions {
  temContaPessoal: boolean;
  temContaConjunta: boolean;
  responsaveis: ExpenseMemberOption[];
}

export interface ExpensesQuery {
  accountScope: ExpenseAccountScope;
  responsibleUserId?: string;
  search?: string;
  limit?: number;
}
