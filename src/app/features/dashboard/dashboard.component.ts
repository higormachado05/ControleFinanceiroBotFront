import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { buildCategoryBreakdown } from '../../core/utils/category-breakdown.utils';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { MonthChangeService } from '../../core/services/month-change.service';
import { formatCurrency, formatDate, isReceita } from '../../core/utils/format.utils';
import { formatMonthLabel } from '../../core/utils/month.utils';
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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly dashboardRefresh = inject(DashboardRefreshService);
  private readonly monthChange = inject(MonthChangeService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly transactions = signal<RecentTransaction[]>([]);

  private refreshSubscription?: Subscription;
  private monthSubscription?: Subscription;

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
  protected readonly formatMonthLabel = formatMonthLabel;
  protected readonly transactionMeta = transactionMeta;
  protected readonly signedAmount = signedAmount;

  ngOnInit(): void {
    this.loadDashboard();
    this.refreshSubscription = this.dashboardRefresh.onRefresh$.subscribe(() =>
      this.loadDashboard(true),
    );
    this.monthSubscription = this.monthChange.monthChanged$.subscribe(() => this.loadDashboard(true));
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.monthSubscription?.unsubscribe();
  }

  loadDashboard(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);

    forkJoin({
      summary: this.dashboardService.getSummary(),
      transactions: this.dashboardService.getRecentTransactions(undefined, MOVEMENTS_FETCH_LIMIT),
    }).subscribe({
      next: ({ summary, transactions }) => {
        this.summary.set(summary);
        this.transactions.set(transactions);
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
