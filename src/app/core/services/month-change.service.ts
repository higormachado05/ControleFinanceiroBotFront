import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { currentMonthPeriod, isSameMonth, MonthPeriod } from '../utils/month.utils';

@Injectable({ providedIn: 'root' })
export class MonthChangeService {
  private readonly changes = new Subject<MonthPeriod>();

  readonly monthChanged$ = this.changes.asObservable();
  readonly currentMonth = signal(currentMonthPeriod());

  constructor() {
    if (typeof document === 'undefined') {
      return;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.check();
      }
    });
    setInterval(() => this.check(), 60_000);
  }

  private check(): void {
    const next = currentMonthPeriod();
    if (isSameMonth(next, this.currentMonth())) {
      return;
    }

    this.currentMonth.set(next);
    this.changes.next(next);
  }
}
