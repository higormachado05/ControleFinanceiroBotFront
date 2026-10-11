import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { formatCurrency, formatDate } from '../../core/utils/format.utils';
import { ExpensesService } from './expenses.service';
import {
  ExpenseAccountScope,
  ExpenseListItem,
  ExpenseMemberOption,
  ExpensesFilterOptions,
} from './models/expenses.models';

@Component({
  selector: 'app-gastos',
  imports: [FormsModule],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.css',
})
export class GastosComponent implements OnInit, OnDestroy {
  private readonly expensesService = inject(ExpensesService);
  private readonly dashboardRefresh = inject(DashboardRefreshService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly totalGastos = signal(0);
  protected readonly items = signal<ExpenseListItem[]>([]);
  protected readonly filterOptions = signal<ExpensesFilterOptions | null>(null);

  protected readonly accountScope = signal<ExpenseAccountScope>('all');
  protected readonly responsibleUserId = signal<string>('');
  protected readonly searchTerm = signal('');

  private refreshSubscription?: Subscription;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;

  ngOnInit(): void {
    this.loadInitialData();
    this.refreshSubscription = this.dashboardRefresh.onRefresh$.subscribe(() => this.loadExpenses(true));
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
  }

  onAccountScopeChange(value: string): void {
    this.accountScope.set(value as ExpenseAccountScope);
    this.loadExpenses();
  }

  onResponsibleChange(value: string): void {
    this.responsibleUserId.set(value);
    this.loadExpenses();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => this.loadExpenses(), 350);
  }

  expenseContext(item: ExpenseListItem): string {
    return `${item.conta.rotulo} · ${item.responsavel.nome}`;
  }

  protected responsibleOptions(): ExpenseMemberOption[] {
    return this.filterOptions()?.responsaveis ?? [];
  }

  loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      options: this.expensesService.getFilterOptions(),
      list: this.expensesService.listExpenses(this.buildQuery()),
    }).subscribe({
      next: ({ options, list }) => {
        this.filterOptions.set(options);
        this.applyListResponse(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar suas despesas. Tente novamente.');
      },
    });
  }

  loadExpenses(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);

    this.expensesService.listExpenses(this.buildQuery()).subscribe({
      next: (list) => {
        this.applyListResponse(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar suas despesas. Tente novamente.');
      },
    });
  }

  private buildQuery() {
    const responsible = this.responsibleUserId().trim();
    return {
      accountScope: this.accountScope(),
      responsibleUserId: responsible || undefined,
      search: this.searchTerm().trim() || undefined,
      limit: 100,
    };
  }

  private applyListResponse(list: { totalGastos: number; itens: ExpenseListItem[] }): void {
    this.totalGastos.set(list.totalGastos);
    this.items.set(list.itens);
  }
}
