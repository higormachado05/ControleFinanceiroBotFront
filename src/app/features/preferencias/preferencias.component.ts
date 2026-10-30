import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MonthChangeService } from '../../core/services/month-change.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { MAX_CYCLE_START_DAY, MIN_CYCLE_START_DAY } from '../../core/utils/month.utils';

@Component({
  selector: 'app-preferencias',
  imports: [FormsModule, RouterLink],
  templateUrl: './preferencias.component.html',
  styleUrl: './preferencias.component.css',
})
export class PreferenciasComponent implements OnInit {
  private readonly preferences = inject(UserPreferencesService);
  private readonly authService = inject(AuthService);
  private readonly monthChange = inject(MonthChangeService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly cycleStartDay = signal(MIN_CYCLE_START_DAY);

  protected readonly minDay = MIN_CYCLE_START_DAY;
  protected readonly maxDay = MAX_CYCLE_START_DAY;

  ngOnInit(): void {
    this.preferences.load().subscribe({
      next: (prefs) => {
        this.cycleStartDay.set(prefs.financialCycleStartDay ?? MIN_CYCLE_START_DAY);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar suas preferências.');
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    this.preferences.update(this.cycleStartDay()).subscribe({
      next: (prefs) => {
        this.cycleStartDay.set(prefs.financialCycleStartDay);
        this.monthChange.refreshCurrentReference();
        this.authService.loadCurrentUser().subscribe();
        this.saving.set(false);
        this.success.set('Preferências salvas. Dashboard e listagens usarão o novo ciclo.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.mensagem ?? 'Não foi possível salvar.');
      },
    });
  }
}
