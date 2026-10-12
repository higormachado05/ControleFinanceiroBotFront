import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePurchaseGoalRequest,
  EvaluatePurchaseGoalsRequest,
  PurchaseGoal,
  PurchaseGoalsList,
  PurchaseSetupOptions,
  UpsertPurchaseAdvisorSettingsRequest,
} from './models/posso-comprar.models';

@Injectable({ providedIn: 'root' })
export class PossoComprarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/posso-comprar`;

  getSetupOptions(): Observable<PurchaseSetupOptions> {
    return this.http.get<PurchaseSetupOptions>(`${this.baseUrl}/setup-options`);
  }

  getSettings(accountId: string): Observable<{ accountId: string; reservaDisponivel: number | null }> {
    const params = new HttpParams().set('accountId', accountId);
    return this.http.get<{ accountId: string; reservaDisponivel: number | null }>(
      `${this.baseUrl}/settings`,
      { params },
    );
  }

  upsertSettings(body: UpsertPurchaseAdvisorSettingsRequest): Observable<{ accountId: string; reservaDisponivel: number | null }> {
    return this.http.put<{ accountId: string; reservaDisponivel: number | null }>(
      `${this.baseUrl}/settings`,
      body,
    );
  }

  listGoals(accountScope: string): Observable<PurchaseGoalsList> {
    const params = new HttpParams().set('accountScope', accountScope);
    return this.http.get<PurchaseGoalsList>(`${this.baseUrl}/goals`, { params });
  }

  createGoal(body: CreatePurchaseGoalRequest): Observable<PurchaseGoal> {
    return this.http.post<PurchaseGoal>(`${this.baseUrl}/goals`, body);
  }

  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/goals/${id}`);
  }

  evaluateAll(body: EvaluatePurchaseGoalsRequest): Observable<PurchaseGoalsList> {
    return this.http.post<PurchaseGoalsList>(`${this.baseUrl}/evaluate`, body);
  }
}
