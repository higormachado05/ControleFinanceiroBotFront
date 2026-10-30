import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import {
  currentReferencePeriod,
  isSameMonth,
  MonthPeriod,
  normalizeCycleStartDay,
} from '../utils/month.utils';
import { UserPreferencesService } from './user-preferences.service';

@Injectable({ providedIn: 'root' })
export class MonthChangeService {
  private readonly preferences = inject(UserPreferencesService);
  private readonly changes = new Subject<MonthPeriod>();

  readonly monthChanged$ = this.changes.asObservable();
  readonly currentMonth = signal<MonthPeriod>(this.resolveCurrentReference());

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

  refreshCurrentReference(): void {
    const next = this.resolveCurrentReference();
    this.currentMonth.set(next);
  }

  private check(): void {
    const next = this.resolveCurrentReference();
    if (isSameMonth(next, this.currentMonth())) {
      return;
    }

    this.currentMonth.set(next);
    this.changes.next(next);
  }

  private resolveCurrentReference(): MonthPeriod {
    const cycleDay = normalizeCycleStartDay(this.preferences.financialCycleStartDay());
    return currentReferencePeriod(cycleDay);
  }
}
