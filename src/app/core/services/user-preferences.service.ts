import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserPreferences } from '../models/financial-period.models';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/user/preferences`;

  readonly financialCycleStartDay = signal(1);

  load(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.url).pipe(
      tap((prefs) => this.financialCycleStartDay.set(prefs.financialCycleStartDay ?? 1)),
    );
  }

  update(financialCycleStartDay: number): Observable<UserPreferences> {
    return this.http
      .put<UserPreferences>(this.url, { financialCycleStartDay })
      .pipe(tap((prefs) => this.financialCycleStartDay.set(prefs.financialCycleStartDay ?? 1)));
  }

  setFromAuth(cycleStartDay: number | undefined): void {
    this.financialCycleStartDay.set(cycleStartDay && cycleStartDay >= 1 ? cycleStartDay : 1);
  }
}
