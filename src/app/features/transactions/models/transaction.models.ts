export type EntryAccountScope = 'personal' | 'joint';

export interface TransactionCategoryOption {
  valor: string;
  rotulo: string;
}

export interface CreateWebTransactionRequest {
  accountScope: EntryAccountScope;
  valor: number;
  descricao: string;
  categoria?: string | null;
  data?: string | null;
}

export interface UpdateWebTransactionRequest {
  valor: number;
  descricao: string;
  categoria?: string | null;
  data?: string | null;
}

export interface WebTransactionResponse {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  categoria: string;
}
