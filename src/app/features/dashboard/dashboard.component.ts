import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { buildCategoryBreakdown } from '../../core/utils/category-breakdown.utils';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { MonthChangeService } from '../../core/services/month-change.service';
import { formatCurrency, formatDate, isReceita } from '../../core/utils/format.utils';
import { PeriodQuery } from '../../core/models/financial-period.models';
import {
  currentReferencePeriod,
  formatPeriodDisplay,
  isSameMonth,
  MonthPeriod,
  parseMonthInputValue,
  toMonthInputValue,
} from '../../core/utils/month.utils';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import {
  signedAmount,
  transactionMeta,
} from '../../core/utils/transaction-display.utils';
import { DashboardService } from './dashboard.service';
import { DashboardSummary, RecentTransaction } from './models/dashboard.models';

const MOVEMENTS_FETCH_LIMIT = 500;
const DASHBOARD_EXPENSES_LIMIT = 3;

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
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
  protected readonly period = signal<MonthPeriod>(
    currentReferencePeriod(1),
  );
  protected readonly useCustomRange = signal(false);
  protected readonly customStartDate = signal('');
  protected readonly customEndDate = signal('');
  protected readonly periodLabel = signal('');

  private refreshSubscription?: Subscription;
  private monthSubscription?: Subscription;
  private followsCurrentMonth = true;

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

  ngOnInit(): void {
    this.period.set(currentReferencePeriod(this.userPreferences.financialCycleStartDay()));
    this.loadDashboard();
    this.refreshSubscription = this.dashboardRefresh.onRefresh$.subscribe(() =>
      this.loadDashboard(true),
    );
    this.monthSubscription = this.monthChange.monthChanged$.subscribe((period) => {
      if (!this.followsCurrentMonth || this.useCustomRange()) {
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
    if (this.useCustomRange()) {
      return;
    }

    const parsed = parseMonthInputValue(value);
    if (!parsed) {
      this.period.set({ ...this.period() });
      return;
    }

    if (isSameMonth(parsed, this.period())) {
      return;
    }

    this.followsCurrentMonth = isSameMonth(parsed, this.monthChange.currentMonth());
    this.period.set(parsed);
    this.loadDashboard();
  }

  onCustomRangeToggle(enabled: boolean): void {
    this.useCustomRange.set(enabled);
    if (enabled) {
      this.followsCurrentMonth = false;
      return;
    }
    this.loadDashboard();
  }

  applyCustomRange(): void {
    if (!this.customStartDate() || !this.customEndDate()) {
      return;
    }
    this.followsCurrentMonth = false;
    this.loadDashboard();
  }

  loadDashboard(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);

    const query = this.buildPeriodQuery();

    forkJoin({
      summary: this.dashboardService.getSummary(undefined, query),
      transactions: this.dashboardService.getRecentTransactions(
        undefined,
        MOVEMENTS_FETCH_LIMIT,
        query,
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

  private buildPeriodQuery(): PeriodQuery {
    if (this.useCustomRange()) {
      return {
        year: this.period().year,
        month: this.period().month,
        startDate: this.customStartDate(),
        endDate: this.customEndDate(),
      };
    }

    const period = this.period();
    return { year: period.year, month: period.month };
  }
}
