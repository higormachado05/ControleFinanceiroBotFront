export type PurchaseAccountScope = 'all' | 'personal' | 'joint';

export type PurchasePaymentMode = 'Avista' | 'Parcelado';

export interface PurchaseSetupOptions {
  temContaPessoal: boolean;
  temContaConjunta: boolean;
  contas: PurchaseAccountOption[];
}

export interface PurchaseAccountOption {
  id: string;
  rotulo: string;
  tipo: string;
}

export interface PurchaseFinancialContext {
  receitaMediaMensal: number;
  gastoMedioMensal: number;
  totalGastosFixos: number;
  sobraMediaMensal: number;
  capacidadePoupancaMensal: number;
  receitasMesAtual: number;
  gastosMesAtual: number;
  sobraMesAtual: number;
  reservaDisponivel: number | null;
  mesesAnalisados: number;
}

export interface PurchaseGoal {
  id: string;
  accountId: string;
  contaRotulo: string;
  titulo: string;
  descricao?: string | null;
  valorAlvo: number;
  valorEntrada: number;
  dataDesejada?: string | null;
  prioridadeUsuario: number;
  modoPagamento: PurchasePaymentMode;
  numParcelas?: number | null;
  valorParcela?: number | null;
  status: string;
  ordemPrioridade: number;
  scoreSaude?: number | null;
  veredito?: string | null;
  poupancaMensalSugerida?: number | null;
  mesesEstimados?: number | null;
  resumoIa?: string | null;
  sugestoes: string[];
  alertas: string[];
  ultimaAvaliacaoUtc?: string | null;
}

export interface PurchaseGoalsList {
  contexto?: PurchaseFinancialContext | null;
  metas: PurchaseGoal[];
  resumoFilaIa?: string | null;
}

export interface CreatePurchaseGoalRequest {
  accountId: string;
  titulo: string;
  descricao?: string;
  valorAlvo: number;
  valorEntrada: number;
  dataDesejada?: string;
  prioridadeUsuario: number;
  modoPagamento: PurchasePaymentMode;
  numParcelas?: number;
  valorParcela?: number;
}

export interface UpsertPurchaseAdvisorSettingsRequest {
  accountId: string;
  reservaDisponivel?: number | null;
}

export interface EvaluatePurchaseGoalsRequest {
  accountScope: PurchaseAccountScope;
  usarIa: boolean;
}
