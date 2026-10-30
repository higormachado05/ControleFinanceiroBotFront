import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { MonthChangeService } from '../../core/services/month-change.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { formatCurrency } from '../../core/utils/format.utils';
import {
  currentReferencePeriod,
  formatPeriodDisplay,
  isSameMonth,
  MonthPeriod,
  parseMonthInputValue,
  toMonthInputValue,
} from '../../core/utils/month.utils';
import {
  CreatePlanningFixedExpenseRequest,
  PlanningAccountScope,
  PlanningSetupOptions,
  PlanningSummary,
  UpsertPlanningVariableLimitRequest,
} from './models/planning.models';
import { PlanningService } from './planning.service';

@Component({
  selector: 'app-planejamento',
  imports: [FormsModule, RouterLink],
  templateUrl: './planejamento.component.html',
  styleUrl: './planejamento.component.css',
})
export class PlanejamentoComponent implements OnInit, OnDestroy {
  private readonly planningService = inject(PlanningService);
  private readonly monthChange = inject(MonthChangeService);
  private readonly userPreferences = inject(UserPreferencesService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly summary = signal<PlanningSummary | null>(null);
  protected readonly setupOptions = signal<PlanningSetupOptions | null>(null);

  protected readonly accountScope = signal<PlanningAccountScope>('all');
  protected readonly period = signal<MonthPeriod>(currentReferencePeriod(1));
  protected readonly periodLabel = signal('');

  protected readonly fixedDescricao = signal('');
  protected readonly fixedValor = signal('');
  protected readonly fixedDia = signal('');
  protected readonly fixedAccountId = signal('');

  protected readonly variableCategoria = signal('Mercado');
  protected readonly variableLimite = signal('');
  protected readonly variableAccountId = signal('');

  private monthSubscription?: Subscription;
  private followsCurrentMonth = true;

  protected readonly formatCurrency = formatCurrency;
  protected readonly monthLabel = computed(() => this.periodLabel());
  protected readonly monthInputValue = computed(() => toMonthInputValue(this.period()));

  protected readonly hasFinancialAccounts = computed(
    () => (this.setupOptions()?.contas.length ?? 0) > 0,
  );

  protected readonly showAccountScopeFilter = computed(() => {
    const setup = this.setupOptions();
    if (!setup) {
      return false;
    }
    return setup.temContaPessoal && setup.temContaConjunta;
  });

  protected readonly accountScopeSummary = computed(() => {
    const setup = this.setupOptions();
    if (!setup || setup.contas.length === 0) {
      return 'Nenhuma conta vinculada';
    }
    if (setup.contas.length === 1) {
      return setup.contas[0].rotulo;
    }
    const scope = this.accountScope();
    if (scope === 'personal') {
      return 'Conta pessoal';
    }
    if (scope === 'joint') {
      return 'Conta conjunta';
    }
    return 'Todas as contas';
  });

  protected readonly selectedFormAccountLabel = computed(() => {
    const setup = this.setupOptions();
    const selectedId = this.variableAccountId() || this.fixedAccountId();
    const match = setup?.contas.find((c) => c.id === selectedId);
    return match?.rotulo ?? setup?.contas[0]?.rotulo ?? '';
  });

  ngOnInit(): void {
    this.period.set(currentReferencePeriod(this.userPreferences.financialCycleStartDay()));
    this.loadInitialData();
    this.monthSubscription = this.monthChange.monthChanged$.subscribe((period) => {
      if (!this.followsCurrentMonth) {
        return;
      }
      this.period.set({ year: period.year, month: period.month });
      this.loadSummary(true);
    });
  }

  ngOnDestroy(): void {
    this.monthSubscription?.unsubscribe();
  }

  onAccountScopeChange(value: string): void {
    this.accountScope.set(value as PlanningAccountScope);
    this.loadSummary();
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

    this.followsCurrentMonth = isSameMonth(parsed, this.monthChange.currentMonth());
    this.period.set(parsed);
    this.loadSummary();
  }

  submitFixedExpense(): void {
    const accountId = this.resolveAccountId(this.fixedAccountId());
    const valor = this.parseMoney(this.fixedValor());
    const descricao = this.fixedDescricao().trim();
    const diaRaw = this.fixedDia().trim();

    const accountError = this.validateAccountSelection(accountId);
    if (accountError) {
      this.actionError.set(accountError);
      return;
    }
    if (!descricao) {
      this.actionError.set('Informe a descrição do gasto fixo.');
      return;
    }
    if (valor === null || valor <= 0) {
      this.actionError.set('Informe um valor maior que zero.');
      return;
    }

    let diaVencimento: number | null = null;
    if (diaRaw) {
      const dia = Number(diaRaw);
      if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
        this.actionError.set('Dia de vencimento inválido (1 a 31).');
        return;
      }
      diaVencimento = dia;
    }

    const body: CreatePlanningFixedExpenseRequest = {
      accountId,
      descricao,
      valor,
      diaVencimento,
    };

    this.saving.set(true);
    this.actionError.set(null);
    this.planningService.createFixedExpense(body).subscribe({
      next: () => {
        this.fixedDescricao.set('');
        this.fixedValor.set('');
        this.fixedDia.set('');
        this.saving.set(false);
        this.loadSummary(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(err.error?.mensagem ?? 'Não foi possível salvar o gasto fixo.');
      },
    });
  }

  removeFixedExpense(id: string): void {
    this.saving.set(true);
    this.actionError.set(null);
    this.planningService.deleteFixedExpense(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadSummary(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(err.error?.mensagem ?? 'Não foi possível excluir o gasto fixo.');
      },
    });
  }

  submitVariableLimit(): void {
    const accountId = this.resolveAccountId(this.variableAccountId());
    const valorLimite = this.parseMoney(this.variableLimite());
    const categoria = this.variableCategoria().trim();

    const accountError = this.validateAccountSelection(accountId);
    if (accountError) {
      this.actionError.set(accountError);
      return;
    }
    if (!categoria) {
      this.actionError.set('Selecione uma categoria para o limite.');
      return;
    }
    if (valorLimite === null || valorLimite <= 0) {
      this.actionError.set('Informe um limite maior que zero (ex.: 850 ou 850,00).');
      return;
    }

    const body: UpsertPlanningVariableLimitRequest = {
      accountId,
      categoria,
      valorLimite,
    };

    this.saving.set(true);
    this.actionError.set(null);
    this.planningService.upsertVariableLimit(body).subscribe({
      next: () => {
        this.variableLimite.set('');
        this.saving.set(false);
        this.loadSummary(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(err.error?.mensagem ?? 'Não foi possível salvar o limite.');
      },
    });
  }

  removeVariableLimit(id: string): void {
    this.saving.set(true);
    this.actionError.set(null);
    this.planningService.deleteVariableLimit(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadSummary(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(err.error?.mensagem ?? 'Não foi possível excluir o limite.');
      },
    });
  }

  loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      setup: this.planningService.getSetupOptions(),
      summary: this.planningService.getSummary(this.buildQuery()),
    }).subscribe({
      next: ({ setup, summary }) => {
        this.setupOptions.set(setup);
        this.syncAccountSelection(setup);
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar o planejamento. Tente novamente.');
      },
    });
  }

  loadSummary(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);

    this.planningService.getSummary(this.buildQuery()).subscribe({
      next: (summary) => {
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
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível atualizar o planejamento. Tente novamente.');
      },
    });
  }

  protected showAccountPickerInForms(): boolean {
    return (this.setupOptions()?.contas.length ?? 0) > 1;
  }

  protected showSingleAccountHintInForms(): boolean {
    return (this.setupOptions()?.contas.length ?? 0) === 1;
  }

  protected alertClass(severidade: string): string {
    if (severidade === 'danger') return 'planning-alert--danger';
    if (severidade === 'warning') return 'planning-alert--warning';
    return 'planning-alert--info';
  }

  protected limitBarClass(status: string): string {
    if (status === 'over') return 'planning-envelope__bar-fill--over';
    if (status === 'warning') return 'planning-envelope__bar-fill--warning';
    return '';
  }

  private buildQuery() {
    const period = this.period();
    return {
      accountScope: this.accountScope(),
      year: period.year,
      month: period.month,
    };
  }

  private syncAccountSelection(setup: PlanningSetupOptions): void {
    const validIds = new Set(setup.contas.map((c) => c.id));
    const first = setup.contas[0]?.id ?? '';

    if (!validIds.has(this.fixedAccountId())) {
      this.fixedAccountId.set(first);
    }
    if (!validIds.has(this.variableAccountId())) {
      this.variableAccountId.set(first);
    }
  }

  private validateAccountSelection(accountId: string): string | null {
    if (!this.hasFinancialAccounts()) {
      return 'Nenhuma conta financeira vinculada. Ative o acesso web ou vincule sua conta pelo Telegram antes de salvar o plano.';
    }
    if (!accountId.trim()) {
      return 'Selecione em qual conta o item do plano será salvo.';
    }
    return null;
  }

  private resolveAccountId(selected: string): string {
    if (selected.trim()) {
      return selected.trim();
    }
    return this.setupOptions()?.contas[0]?.id ?? '';
  }

  private parseMoney(raw: string): number | null {
    const normalized = raw
      .trim()
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    if (!normalized) {
      return null;
    }
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }
}
