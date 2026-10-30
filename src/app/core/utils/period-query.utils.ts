import { HttpParams } from '@angular/common/http';
import { PeriodQuery } from '../models/financial-period.models';

export function appendPeriodParams(params: HttpParams, query?: PeriodQuery): HttpParams {
  if (!query) {
    return params;
  }

  if (query.startDate && query.endDate) {
    return params.set('startDate', query.startDate).set('endDate', query.endDate);
  }

  if (query.year && query.month) {
    return params.set('year', query.year.toString()).set('month', query.month.toString());
  }

  return params;
}
