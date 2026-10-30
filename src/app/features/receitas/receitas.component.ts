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
import { buildCategoryBreakdown } from '../../core/utils/category-breakdown.utils';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { MonthChangeService } from '../../core/services/month-change.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import {
  formatCurrency,
  formatDate,
  isReceita,
  parseMoneyInput,
  toDateInputValue,
} from '../../core/utils/format.utils';
import { ExpensesService } from '../gastos/expenses.service';
import { ExpensesFilterOptions } from '../gastos/models/expenses.models';
import { TransactionsService } from '../transactions/transactions.service';
import { EntryAccountScope, TransactionCategoryOption } from '../transactions/models/transaction.models';
import {
  currentReferencePeriod,
  formatPeriodDisplay,
  isSameMonth,
  MonthPeriod,
  parseMonthInputValue,
  toMonthInputValue,
} from '../../core/utils/month.utils';
import {
  signedAmount,
  transactionMeta,
} from '../../core/utils/transaction-display.utils';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardSummary, RecentTransaction } from '../dashboard/models/dashboard.models';

const LIST_FETCH_LIMIT = 500;
const MOBILE_LIST_LIMIT = 8;
const MOBILE_MEDIA = '(max-width: 640px)';

@Component({
  selector: 'app-receitas',
  imports: [FormsModule],
  templateUrl: './receitas.component.html',
  styleUrl: './receitas.component.css',
})
export class ReceitasComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly expensesService = inject(ExpensesService);
  private readonly transactionsService = inject(TransactionsService);
  private readonly dashboardRefresh = inject(DashboardRefreshService);
  private readonly monthChange = inject(MonthChangeService);
  private readonly userPreferences = inject(UserPreferencesService);
  private readonly entryFormSection = viewChild<ElementRef<HTMLElement>>('entryFormSection');

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filterOptions = signal<ExpensesFilterOptions | null>(null);
  protected readonly categories = signal<TransactionCategoryOption[]>([]);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly transactions = signal<RecentTransaction[]>([]);
  protected readonly isCompactList = signal(false);
  protected readonly period = signal<MonthPeriod>(currentReferencePeriod(1));
  protected readonly useCustomRange = signal(false);
  protected readonly customStartDate = signal('');
  protected readonly customEndDate = signal('');
  protected readonly periodLabel = signal('');

  private refreshSubscription?: Subscription;
  private monthSubscription?: Subscription;
  private followsCurrentMonth = true;
  private hasLoaded = false;
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
  protected readonly monthLabel = computed(() => this.periodLabel());
  protected readonly monthInputValue = computed(() => toMonthInputValue(this.period()));
  protected readonly transactionMeta = transactionMeta;
  protected readonly signedAmount = signedAmount;

  protected readonly entryDescricao = signal('');
  protected readonly entryValor = signal('');
  protected readonly entryCategoria = signal('Outros');
  protected readonly entryData = signal(this.todayDateInput());
  protected readonly entryAccountScope = signal<EntryAccountScope>('personal');
  protected readonly editingIncomeId = signal<string | null>(null);

  protected readonly hasFinancialAccounts = computed(
    () =>
      this.filterOptions()?.temContaPessoal === true ||
      this.filterOptions()?.temContaConjunta === true,
  );
  protected readonly showEntryAccountPicker = computed(
    () =>
      !this.editingIncomeId() &&
      this.filterOptions()?.temContaPessoal === true &&
      this.filterOptions()?.temContaConjunta === true,
  );
  protected readonly entryFormTitle = computed(() =>
    this.editingIncomeId() ? 'Editar receita' : 'Nova receita',
  );
  protected readonly entrySubmitLabel = computed(() =>
    this.editingIncomeId() ? 'Salvar alterações' : 'Registrar receita',
  );

  ngOnInit(): void {
    this.period.set(currentReferencePeriod(this.userPreferences.financialCycleStartDay()));
    this.bindMobileList();
    this.loadData();
    this.refreshSubscription = this.dashboardRefresh.onRefresh$.subscribe(() => this.loadData(true));
    this.monthSubscription = this.monthChange.monthChanged$.subscribe((period) => {
      if (!this.followsCurrentMonth || this.useCustomRange()) {
        return;
      }
      this.period.set({ year: period.year, month: period.month });
      this.loadData(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.monthSubscription?.unsubscribe();
    this.mobileMedia?.removeEventListener('change', this.onMobileChange);
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
    this.loadData();
  }

  onCustomRangeToggle(enabled: boolean): void {
    this.useCustomRange.set(enabled);
    if (!enabled) {
      this.loadData();
    }
  }

  applyCustomRange(): void {
    if (!this.customStartDate() || !this.customEndDate()) {
      return;
    }
    this.followsCurrentMonth = false;
    this.loadData();
  }

  startEditIncome(transaction: RecentTransaction): void {
    this.editingIncomeId.set(transaction.id);
    this.entryDescricao.set(transaction.descricao);
    this.entryValor.set(String(transaction.valor).replace('.', ','));
    this.entryCategoria.set(this.resolveCategoryValue(transaction.categoria));
    this.entryData.set(toDateInputValue(transaction.data) || this.todayDateInput());
    this.actionError.set(null);
    scrollElementIntoView(this.entryFormSection()?.nativeElement);
  }

  cancelEditIncome(): void {
    this.resetEntryForm();
  }

  deleteIncome(id: string): void {
    if (!confirm('Excluir esta receita?')) {
      return;
    }

    this.saving.set(true);
    this.actionError.set(null);
    this.transactionsService.delete(id).subscribe({
      next: () => {
        if (this.editingIncomeId() === id) {
          this.resetEntryForm();
        }
        this.saving.set(false);
        this.dashboardRefresh.requestRefresh();
        this.loadData(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(err.error?.mensagem ?? 'Não foi possível excluir a receita.');
      },
    });
  }

  submitIncome(): void {
    const valor = parseMoneyInput(this.entryValor());
    const descricao = this.entryDescricao().trim();
    const editingId = this.editingIncomeId();

    if (!editingId && !this.hasFinancialAccounts()) {
      this.actionError.set('Nenhuma conta financeira vinculada para registrar receitas.');
      return;
    }
    if (!descricao) {
      this.actionError.set('Informe a descrição da receita.');
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
      : this.transactionsService.createIncome({
          accountScope: this.entryAccountScope(),
          ...payload,
        });

    request$.subscribe({
      next: () => {
        this.resetEntryForm();
        this.saving.set(false);
        this.dashboardRefresh.requestRefresh();
        this.loadData(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(
          err.error?.mensagem ??
            (editingId
              ? 'Não foi possível atualizar a receita.'
              : 'Não foi possível registrar a receita.'),
        );
      },
    });
  }

  loadData(silent = false): void {
    if (!silent && !this.hasLoaded) {
      this.loading.set(true);
    }
    this.error.set(null);

    const query = this.buildPeriodQuery();
    forkJoin({
      summary: this.dashboardService.getSummary(undefined, query),
      transactions: this.dashboardService.getRecentTransactions(undefined, LIST_FETCH_LIMIT, query),
      options: this.expensesService.getFilterOptions(),
      categories: this.transactionsService.getCategories(),
    }).subscribe({
      next: ({ summary, transactions, options, categories }) => {
        this.summary.set(summary);
        this.periodLabel.set(
          formatPeriodDisplay({
            year: summary.ano,
            month: summary.mes,
            diaInicioCiclo: summary.diaInicioCiclo,
            periodoInicio: summary.periodoInicio,
            periodoFim: summary.periodoFim,
          }),
        );
        this.transactions.set(transactions);
        this.filterOptions.set(options);
        this.categories.set(categories);
        this.syncEntryAccountScope(options);
        this.hasLoaded = true;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar suas receitas. Tente novamente.');
      },
    });
  }

  private buildPeriodQuery() {
    const period = this.period();
    if (this.useCustomRange()) {
      return {
        year: period.year,
        month: period.month,
        startDate: this.customStartDate(),
        endDate: this.customEndDate(),
      };
    }
    return { year: period.year, month: period.month };
  }

  private syncEntryAccountScope(options: ExpensesFilterOptions): void {
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
    this.editingIncomeId.set(null);
    this.entryDescricao.set('');
    this.entryValor.set('');
    this.entryCategoria.set('Outros');
    this.entryData.set(this.todayDateInput());
    const options = this.filterOptions();
    if (options) {
      this.syncEntryAccountScope(options);
    }
  }

  private resolveCategoryValue(raw?: string): string {
    const normalized = raw?.trim() ?? '';
    if (!normalized) {
      return 'Outros';
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

  private bindMobileList(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.mobileMedia = window.matchMedia(MOBILE_MEDIA);
    this.isCompactList.set(this.mobileMedia.matches);
    this.mobileMedia.addEventListener('change', this.onMobileChange);
  }
}
