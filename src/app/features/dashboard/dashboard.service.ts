import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PeriodQuery } from '../../core/models/financial-period.models';
import { appendPeriodParams } from '../../core/utils/period-query.utils';
import { DashboardSummary, RecentTransaction } from './models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardUrl = `${environment.apiUrl}/api/dashboard`;

  getSummary(financialAccountId?: string, period?: PeriodQuery): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.dashboardUrl}/summary`, {
      params: this.buildParams(financialAccountId, period),
    });
  }

  getRecentTransactions(
    financialAccountId?: string,
    limit = 10,
    period?: PeriodQuery,
  ): Observable<RecentTransaction[]> {
    let params = this.buildParams(financialAccountId, period);
    params = params.set('limit', limit.toString());

    return this.http.get<RecentTransaction[]>(`${this.dashboardUrl}/recent-transactions`, {
      params,
    });
  }

  private buildParams(financialAccountId?: string, period?: PeriodQuery): HttpParams {
    let params = new HttpParams();
    if (financialAccountId) {
      params = params.set('financialAccountId', financialAccountId);
    }
    return appendPeriodParams(params, period);
  }
}
