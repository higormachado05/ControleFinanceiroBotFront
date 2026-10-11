import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExpensesFilterOptions,
  ExpensesListResponse,
  ExpensesQuery,
} from './models/expenses.models';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/expenses`;

  getFilterOptions(): Observable<ExpensesFilterOptions> {
    return this.http.get<ExpensesFilterOptions>(`${this.baseUrl}/filter-options`);
  }

  listExpenses(query: ExpensesQuery): Observable<ExpensesListResponse> {
    let params = new HttpParams()
      .set('accountScope', query.accountScope)
      .set('limit', (query.limit ?? 100).toString());

    if (query.responsibleUserId) {
      params = params.set('responsibleUserId', query.responsibleUserId);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<ExpensesListResponse>(this.baseUrl, { params });
  }
}
