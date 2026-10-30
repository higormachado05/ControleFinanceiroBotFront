export type PlanningAccountScope = 'all' | 'personal' | 'joint';

export interface PlanningAccountOption {
  id: string;
  rotulo: string;
  tipo: string;
}

export interface PlanningCategoryOption {
  valor: string;
  rotulo: string;
}

export interface PlanningSetupOptions {
  temContaPessoal: boolean;
  temContaConjunta: boolean;
  contas: PlanningAccountOption[];
  categorias: PlanningCategoryOption[];
}

export interface PlanningFixedExpense {
  id: string;
  accountId: string;
  contaRotulo: string;
  descricao: string;
  valor: number;
  diaVencimento?: number | null;
  ativo: boolean;
}

export interface PlanningVariableProgress {
  id: string;
  accountId: string;
  contaRotulo: string;
  categoria: string;
  categoriaRotulo: string;
  valorLimite: number;
  gastoRealizado: number;
  restante: number;
  percentualUsado: number;
  status: 'ok' | 'warning' | 'over';
}

export interface PlanningAlert {
  tipo: string;
  mensagem: string;
  severidade: 'info' | 'warning' | 'danger';
}

export interface PlanningSummary {
  ano: number;
  mes: number;
  diaInicioCiclo?: number;
  periodoInicio?: string;
  periodoFim?: string;
  receitasNoMes: number;
  totalGastosFixos: number;
  totalLimitesVariaveis: number;
  totalPlanejado: number;
  gastosRealizados: number;
  sobraAposFixos: number;
  gastosFixos: PlanningFixedExpense[];
  envelopesVariaveis: PlanningVariableProgress[];
  alertas: PlanningAlert[];
}

export interface CreatePlanningFixedExpenseRequest {
  accountId: string;
  descricao: string;
  valor: number;
  diaVencimento?: number | null;
}

export interface UpsertPlanningVariableLimitRequest {
  accountId: string;
  categoria: string;
  valorLimite: number;
}

export interface PlanningSummaryQuery {
  accountScope: PlanningAccountScope;
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
}
