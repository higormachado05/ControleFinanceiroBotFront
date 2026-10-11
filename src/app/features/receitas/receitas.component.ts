import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { buildCategoryBreakdown } from '../../core/utils/category-breakdown.utils';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { formatCurrency, formatDate, isReceita } from '../../core/utils/format.utils';
import {
  signedAmount,
  transactionMeta,
} from '../../core/utils/transaction-display.utils';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardSummary, RecentTransaction } from '../dashboard/models/dashboard.models';

const LIST_FETCH_LIMIT = 100;
const MOBILE_LIST_LIMIT = 8;
const MOBILE_MEDIA = '(max-width: 640px)';

@Component({
  selector: 'app-receitas',
  templateUrl: './receitas.component.html',
  styleUrl: './receitas.component.css',
})
export class ReceitasComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly dashboardRefresh = inject(DashboardRefreshService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly transactions = signal<RecentTransaction[]>([]);
  protected readonly isCompactList = signal(false);

  private refreshSubscription?: Subscription;
  private mobileMedia?: MediaQueryList;
  private readonly onMobileChange = (event: MediaQueryListEvent): void => {
    this.isCompactList.set(event.matches);
  };

  protected readonly incomeTransactions = computed(() =>
    this.transactions().filter((item) => isReceita(item.tipo)),
  );

  protected readonly displayedTransactions = computed(() => {
    const items = this.incomeTransactions();
    if (!this.isCompactList()) {
      return items;
    }
    return items.slice(0, MOBILE_LIST_LIMIT);
  });

  protected readonly listHint = computed(() => {
    if (!this.isCompactList()) {
      return null;
    }
    const total = this.incomeTransactions().length;
    const shown = this.displayedTransactions().length;
    return total > shown ? `Mostrando ${shown} de ${total} receitas` : null;
  });

  protected readonly categoryBreakdown = computed(() =>
    buildCategoryBreakdown(this.transactions(), 'income'),
  );

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly transactionMeta = transactionMeta;
  protected readonly signedAmount = signedAmount;

  ngOnInit(): void {
    this.bindMobileList();
    this.loadData();
    this.refreshSubscription = this.dashboardRefresh.onRefresh$.subscribe(() => this.loadData(true));
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.mobileMedia?.removeEventListener('change', this.onMobileChange);
  }

  loadData(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);

    forkJoin({
      summary: this.dashboardService.getSummary(),
      transactions: this.dashboardService.getRecentTransactions(undefined, LIST_FETCH_LIMIT),
    }).subscribe({
      next: ({ summary, transactions }) => {
        this.summary.set(summary);
        this.transactions.set(transactions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar suas receitas. Tente novamente.');
      },
    });
  }

  private bindMobileList(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.mobileMedia = window.matchMedia(MOBILE_MEDIA);
    this.isCompactList.set(this.mobileMedia.matches);
    this.mobileMedia.addEventListener('change', this.onMobileChange);
  }
}
