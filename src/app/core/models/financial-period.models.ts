import { MonthPeriod } from '../utils/month.utils';

export interface FinancialPeriodMetadata {
  ano: number;
  mes: number;
  diaInicioCiclo: number;
  periodoInicio: string;
  periodoFim: string;
}

export interface UserPreferences {
  financialCycleStartDay: number;
}

export interface PeriodQuery {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
}
