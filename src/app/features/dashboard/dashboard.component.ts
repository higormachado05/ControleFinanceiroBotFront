import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { buildCategoryBreakdown } from '../../core/utils/category-breakdown.utils';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { MonthChangeService } from '../../core/services/month-change.service';
import { formatCurrency, formatDate, isReceita } from '../../core/utils/format.utils';
import {
  currentReferencePeriod,
  formatPeriodDisplay,
  isSameMonth,
  MonthPeriod,
  normalizeCycleStartDay,
  parseMonthInputValue,
  toMonthInputValue,
} from '../../core/utils/month.utils';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import {
  signedAmount,
  transactionMeta,
} from '../../core/utils/transaction-display.utils';
import { PeriodViewControlsComponent } from '../../shared/components/period-view-controls/period-view-controls.component';
import { DashboardService } from './dashboard.service';
import { DashboardSummary, RecentTransaction } from './models/dashboard.models';

const MOVEMENTS_FETCH_LIMIT = 500;
const DASHBOARD_EXPENSES_LIMIT = 3;

@Component({
  selector: 'app-dashboard',
  imports: [PeriodViewControlsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly dashboardRefresh = inject(DashboardRefreshService);
  private readonly monthChange = inject(MonthChangeService);
  private readonly userPreferences = inject(UserPreferencesService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly transactions = signal<RecentTransaction[]>([]);
  protected readonly period = signal<MonthPeriod>(currentReferencePeriod(1));
  protected readonly periodLabel = signal('');

  private refreshSubscription?: Subscription;
  private monthSubscription?: Subscription;
  private followsCurrentPeriod = true;

  protected readonly recentExpenses = computed(() =>
    this.transactions()
      .filter((item) => !isReceita(item.tipo))
      .slice(0, DASHBOARD_EXPENSES_LIMIT),
  );

  protected readonly categoryExpenses = computed(() =>
    buildCategoryBreakdown(this.transactions(), 'expense'),
  );

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly transactionMeta = transactionMeta;
  protected readonly signedAmount = signedAmount;
  protected readonly monthInputValue = computed(() => toMonthInputValue(this.period()));
  protected readonly monthLabel = computed(() => this.periodLabel());
  protected readonly cycleStartDay = computed(() =>
    normalizeCycleStartDay(this.userPreferences.financialCycleStartDay()),
  );
  protected readonly viewingCurrentPeriod = computed(() => {
    const current = currentReferencePeriod(this.cycleStartDay());
    const viewed = this.period();
    return isSameMonth(viewed, current);
  });
  protected readonly balanceLabel = computed(() =>
    this.cycleStartDay() === 1 ? 'Saldo do mês' : 'Saldo do período',
  );

  ngOnInit(): void {
    this.period.set(currentReferencePeriod(this.cycleStartDay()));
    this.loadDashboard();
    this.refreshSubscription = this.dashboardRefresh.onRefresh$.subscribe(() =>
      this.loadDashboard(true),
    );
    this.monthSubscription = this.monthChange.monthChanged$.subscribe((period) => {
      if (!this.followsCurrentPeriod) {
        return;
      }
      this.period.set({ year: period.year, month: period.month });
      this.loadDashboard(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.monthSubscription?.unsubscribe();
  }

  onMonthInput(value: string): void {
    const parsed = parseMonthInputValue(value);
    if (!parsed) {
      this.period.set({ ...this.period() });
      return;
    }

    if (isSameMonth(parsed, this.period())) {
      return;
    }

    const current = currentReferencePeriod(this.cycleStartDay());
    this.followsCurrentPeriod = isSameMonth(parsed, current);
    this.period.set(parsed);
    this.loadDashboard();
  }

  goToCurrentPeriod(): void {
    const current = currentReferencePeriod(this.cycleStartDay());
    this.followsCurrentPeriod = true;
    this.period.set(current);
    this.loadDashboard();
  }

  loadDashboard(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);

    const period = this.period();

    forkJoin({
      summary: this.dashboardService.getSummary(undefined, period),
      transactions: this.dashboardService.getRecentTransactions(
        undefined,
        MOVEMENTS_FETCH_LIMIT,
        period,
      ),
    }).subscribe({
      next: ({ summary, transactions }) => {
        this.summary.set(summary);
        this.transactions.set(transactions);
        this.periodLabel.set(
          formatPeriodDisplay({
            year: summary.ano,
            month: summary.mes,
            diaInicioCiclo: summary.diaInicioCiclo,
            periodoInicio: summary.periodoInicio,
            periodoFim: summary.periodoFim,
          }),
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.',
        );
      },
    });
  }
}
