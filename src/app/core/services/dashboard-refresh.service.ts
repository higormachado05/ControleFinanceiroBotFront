import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardRefreshService {
  private readonly refreshSubject = new Subject<void>();

  readonly onRefresh$ = this.refreshSubject.asObservable();

  requestRefresh(): void {
    this.refreshSubject.next();
  }
}
