import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { appendPeriodParams } from '../../core/utils/period-query.utils';
import {
  CreatePlanningFixedExpenseRequest,
  PlanningFixedExpense,
  PlanningSetupOptions,
  PlanningSummary,
  PlanningSummaryQuery,
  UpsertPlanningVariableLimitRequest,
} from './models/planning.models';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/planning`;

  getSetupOptions(): Observable<PlanningSetupOptions> {
    return this.http.get<PlanningSetupOptions>(`${this.baseUrl}/setup-options`);
  }

  getSummary(query: PlanningSummaryQuery): Observable<PlanningSummary> {
    let params = new HttpParams().set('accountScope', query.accountScope);

    params = appendPeriodParams(params, query);

    return this.http.get<PlanningSummary>(`${this.baseUrl}/summary`, { params });
  }

  createFixedExpense(body: CreatePlanningFixedExpenseRequest): Observable<PlanningFixedExpense> {
    return this.http.post<PlanningFixedExpense>(`${this.baseUrl}/fixed-expenses`, body);
  }

  deleteFixedExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/fixed-expenses/${id}`);
  }

  upsertVariableLimit(body: UpsertPlanningVariableLimitRequest): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/variable-limits`, body);
  }

  deleteVariableLimit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/variable-limits/${id}`);
  }
}
