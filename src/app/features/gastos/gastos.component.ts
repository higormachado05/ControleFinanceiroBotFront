import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { scrollElementIntoView } from '../../core/utils/scroll-into-view.utils';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { MonthChangeService } from '../../core/services/month-change.service';
import {
  formatCurrency,
  formatDate,
  parseMoneyInput,
  toDateInputValue,
} from '../../core/utils/format.utils';
import { TransactionsService } from '../transactions/transactions.service';
import { EntryAccountScope, TransactionCategoryOption } from '../transactions/models/transaction.models';
import {
  currentMonthPeriod,
  formatMonthLabel,
  isAfterMonth,
  isSameMonth,
  MonthPeriod,
  parseMonthInputValue,
  toMonthInputValue,
} from '../../core/utils/month.utils';
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
  private readonly transactionsService = inject(TransactionsService);
  private readonly dashboardRefresh = inject(DashboardRefreshService);
  private readonly monthChange = inject(MonthChangeService);
  private readonly entryFormSection = viewChild<ElementRef<HTMLElement>>('entryFormSection');

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly categories = signal<TransactionCategoryOption[]>([]);
  protected readonly totalGastos = signal(0);
  protected readonly items = signal<ExpenseListItem[]>([]);
  protected readonly filterOptions = signal<ExpensesFilterOptions | null>(null);

  protected readonly accountScope = signal<ExpenseAccountScope>('all');
  protected readonly responsibleUserId = signal<string>('');
  protected readonly searchTerm = signal('');
  protected readonly period = signal<MonthPeriod>(currentMonthPeriod());

  private refreshSubscription?: Subscription;
  private monthSubscription?: Subscription;
  private followsCurrentMonth = true;
  private hasLoaded = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  protected readonly entryDescricao = signal('');
  protected readonly entryValor = signal('');
  protected readonly entryCategoria = signal('Mercado');
  protected readonly entryData = signal(this.todayDateInput());
  protected readonly entryMaxDate = this.todayDateInput();
  protected readonly entryAccountScope = signal<EntryAccountScope>('personal');
  protected readonly editingExpenseId = signal<string | null>(null);

  protected readonly formatCurrency = formatCurrency;
  protected readonly hasFinancialAccounts = computed(
    () =>
      this.filterOptions()?.temContaPessoal === true ||
      this.filterOptions()?.temContaConjunta === true,
  );
  protected readonly showEntryAccountPicker = computed(
    () =>
      !this.editingExpenseId() &&
      this.filterOptions()?.temContaPessoal === true &&
      this.filterOptions()?.temContaConjunta === true,
  );
  protected readonly entryFormTitle = computed(() =>
    this.editingExpenseId() ? 'Editar gasto' : 'Novo gasto',
  );
  protected readonly entrySubmitLabel = computed(() =>
    this.editingExpenseId() ? 'Salvar alterações' : 'Registrar despesa',
  );
  protected readonly formatDate = formatDate;
  protected readonly monthLabel = computed(() => {
    const period = this.period();
    return formatMonthLabel(period.year, period.month);
  });
  protected readonly monthInputValue = computed(() => toMonthInputValue(this.period()));
  protected readonly maxMonth = computed(() => toMonthInputValue(this.monthChange.currentMonth()));

  ngOnInit(): void {
    this.loadInitialData();
    this.refreshSubscription = this.dashboardRefresh.onRefresh$.subscribe(() => this.loadExpenses(true));
    this.monthSubscription = this.monthChange.monthChanged$.subscribe((period) => {
      if (!this.followsCurrentMonth) {
        return;
      }
      this.period.set({ year: period.year, month: period.month });
      this.loadExpenses(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.monthSubscription?.unsubscribe();
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
  }

  onAccountScopeChange(value: string): void {
    this.accountScope.set(value as ExpenseAccountScope);
    this.syncEntryAccountScopeFromFilter();
    this.loadExpenses();
  }

  onResponsibleChange(value: string): void {
    this.responsibleUserId.set(value);
    this.loadExpenses();
  }

  onMonthInput(value: string): void {
    const current = this.monthChange.currentMonth();
    const parsed = parseMonthInputValue(value);
    if (!parsed || isAfterMonth(parsed, current)) {
      this.period.set({ ...this.period() });
      return;
    }

    if (isSameMonth(parsed, this.period())) {
      return;
    }

    this.followsCurrentMonth = isSameMonth(parsed, current);
    this.period.set(parsed);
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

  startEditExpense(item: ExpenseListItem): void {
    this.editingExpenseId.set(item.id);
    this.entryDescricao.set(item.descricao);
    this.entryValor.set(String(item.valor).replace('.', ','));
    this.entryCategoria.set(this.resolveCategoryValue(item.categoria));
    this.entryData.set(toDateInputValue(item.data) || this.todayDateInput());
    this.actionError.set(null);
    scrollElementIntoView(this.entryFormSection()?.nativeElement);
  }

  cancelEditExpense(): void {
    this.resetEntryForm();
  }

  deleteExpense(id: string): void {
    if (!confirm('Excluir esta despesa?')) {
      return;
    }

    this.saving.set(true);
    this.actionError.set(null);
    this.transactionsService.delete(id).subscribe({
      next: () => {
        if (this.editingExpenseId() === id) {
          this.resetEntryForm();
        }
        this.saving.set(false);
        this.dashboardRefresh.requestRefresh();
        this.loadExpenses(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(err.error?.mensagem ?? 'Não foi possível excluir a despesa.');
      },
    });
  }

  submitExpense(): void {
    const valor = parseMoneyInput(this.entryValor());
    const descricao = this.entryDescricao().trim();
    const editingId = this.editingExpenseId();

    if (!editingId && !this.hasFinancialAccounts()) {
      this.actionError.set('Nenhuma conta financeira vinculada para registrar despesas.');
      return;
    }
    if (!descricao) {
      this.actionError.set('Informe a descrição da despesa.');
      return;
    }
    if (valor === null || valor <= 0) {
      this.actionError.set('Informe um valor maior que zero.');
      return;
    }

    const payload = {
      descricao,
      valor,
      categoria: this.entryCategoria(),
      data: this.entryData() || null,
    };

    this.saving.set(true);
    this.actionError.set(null);
    const request$ = editingId
      ? this.transactionsService.update(editingId, payload)
      : this.transactionsService.createExpense({
          accountScope: this.entryAccountScope(),
          ...payload,
        });

    request$.subscribe({
      next: () => {
        this.resetEntryForm();
        this.saving.set(false);
        this.dashboardRefresh.requestRefresh();
        this.loadExpenses(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(
          err.error?.mensagem ??
            (editingId
              ? 'Não foi possível atualizar a despesa.'
              : 'Não foi possível registrar a despesa.'),
        );
      },
    });
  }

  loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      options: this.expensesService.getFilterOptions(),
      list: this.expensesService.listExpenses(this.buildQuery()),
      categories: this.transactionsService.getCategories(),
    }).subscribe({
      next: ({ options, list, categories }) => {
        this.filterOptions.set(options);
        this.categories.set(categories);
        this.syncEntryAccountScopeFromFilter();
        this.applyListResponse(list);
        this.hasLoaded = true;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar suas despesas. Tente novamente.');
      },
    });
  }

  loadExpenses(silent = false): void {
    if (!silent && !this.hasLoaded) {
      this.loading.set(true);
    }
    this.error.set(null);

    this.expensesService.listExpenses(this.buildQuery()).subscribe({
      next: (list) => {
        this.applyListResponse(list);
        this.hasLoaded = true;
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
    const period = this.period();
    return {
      accountScope: this.accountScope(),
      responsibleUserId: responsible || undefined,
      search: this.searchTerm().trim() || undefined,
      year: period.year,
      month: period.month,
      limit: 500,
    };
  }

  private applyListResponse(list: { totalGastos: number; itens: ExpenseListItem[] }): void {
    this.totalGastos.set(list.totalGastos);
    this.items.set(list.itens);
  }

  private syncEntryAccountScopeFromFilter(): void {
    const options = this.filterOptions();
    if (!options) {
      return;
    }

    const filterScope = this.accountScope();
    if (filterScope === 'personal' && options.temContaPessoal) {
      this.entryAccountScope.set('personal');
      return;
    }
    if (filterScope === 'joint' && options.temContaConjunta) {
      this.entryAccountScope.set('joint');
      return;
    }
    if (options.temContaPessoal) {
      this.entryAccountScope.set('personal');
      return;
    }
    if (options.temContaConjunta) {
      this.entryAccountScope.set('joint');
    }
  }

  private todayDateInput(): string {
    return toDateInputValue(new Date());
  }

  private resetEntryForm(): void {
    this.editingExpenseId.set(null);
    this.entryDescricao.set('');
    this.entryValor.set('');
    this.entryCategoria.set('Mercado');
    this.entryData.set(this.todayDateInput());
    this.syncEntryAccountScopeFromFilter();
  }

  private resolveCategoryValue(raw?: string): string {
    const normalized = raw?.trim() ?? '';
    if (!normalized) {
      return 'Mercado';
    }

    const categories = this.categories();
    const byValue = categories.find((c) => c.valor.toLowerCase() === normalized.toLowerCase());
    if (byValue) {
      return byValue.valor;
    }

    const byLabel = categories.find((c) =>
      c.rotulo.toLowerCase().includes(normalized.toLowerCase()),
    );
    return byLabel?.valor ?? 'Outros';
  }
}
