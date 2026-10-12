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
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { formatCurrency, parseMoneyInput } from '../../core/utils/format.utils';
import { scrollElementIntoView } from '../../core/utils/scroll-into-view.utils';
import {
  CreatePurchaseGoalRequest,
  PurchaseAccountScope,
  PurchaseGoal,
  PurchaseGoalsList,
  PurchaseSetupOptions,
} from './models/posso-comprar.models';
import { PossoComprarService } from './posso-comprar.service';

const COMPACT_UI_MEDIA = '(max-width: 640px)';

@Component({
  selector: 'app-posso-comprar',
  imports: [FormsModule, RouterLink],
  templateUrl: './posso-comprar.component.html',
  styleUrl: './posso-comprar.component.css',
})
export class PossoComprarComponent implements OnInit, OnDestroy {
  private readonly possoComprarService = inject(PossoComprarService);
  private readonly simulationFormSection = viewChild<ElementRef<HTMLElement>>('simulationFormSection');

  private compactMedia?: MediaQueryList;
  private readonly onCompactChange = (event: MediaQueryListEvent): void => {
    this.isCompactUi.set(event.matches);
    this.syncSimulationFormVisibility(event.matches);
  };

  protected readonly isCompactUi = signal(false);
  protected readonly simulationFormOpen = signal(false);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly evaluating = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  protected readonly setupOptions = signal<PurchaseSetupOptions | null>(null);
  protected readonly list = signal<PurchaseGoalsList | null>(null);

  protected readonly accountScope = signal<PurchaseAccountScope>('all');
  protected readonly reservaInput = signal('');
  protected readonly settingsAccountId = signal('');

  protected readonly titulo = signal('');
  protected readonly descricao = signal('');
  protected readonly valorAlvo = signal('');
  protected readonly valorEntrada = signal('');
  protected readonly dataDesejada = signal('');
  protected readonly prioridade = signal(3);
  protected readonly modoPagamento = signal<'Avista' | 'Parcelado'>('Avista');
  protected readonly numParcelas = signal('');
  protected readonly goalAccountId = signal('');

  protected readonly formatCurrency = formatCurrency;

  protected readonly hasFinancialAccounts = computed(
    () => (this.setupOptions()?.contas.length ?? 0) > 0,
  );

  protected readonly showAccountScopeFilter = computed(() => {
    const setup = this.setupOptions();
    if (!setup) return false;
    return setup.temContaPessoal && setup.temContaConjunta;
  });

  protected readonly metas = computed(() => this.list()?.metas ?? []);
  protected readonly contexto = computed(() => this.list()?.contexto ?? null);
  protected readonly resumoFilaIa = computed(() => this.list()?.resumoFilaIa ?? null);

  protected readonly showSimulationForm = computed(
    () => !this.isCompactUi() || this.simulationFormOpen(),
  );

  ngOnInit(): void {
    this.bindCompactUi();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.compactMedia?.removeEventListener('change', this.onCompactChange);
  }

  openSimulationForm(): void {
    this.simulationFormOpen.set(true);
    this.actionError.set(null);
    setTimeout(() => scrollElementIntoView(this.simulationFormSection()?.nativeElement), 0);
  }

  closeSimulationForm(): void {
    this.simulationFormOpen.set(false);
    this.actionError.set(null);
  }

  private bindCompactUi(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.compactMedia = window.matchMedia(COMPACT_UI_MEDIA);
    this.isCompactUi.set(this.compactMedia.matches);
    this.syncSimulationFormVisibility(this.compactMedia.matches);
    this.compactMedia.addEventListener('change', this.onCompactChange);
  }

  private syncSimulationFormVisibility(isCompact: boolean): void {
    this.simulationFormOpen.set(!isCompact);
  }

  loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      setup: this.possoComprarService.getSetupOptions(),
      goals: this.possoComprarService.listGoals(this.accountScope()),
    }).subscribe({
      next: ({ setup, goals }) => {
        this.setupOptions.set(setup);
        this.list.set(goals);
        const firstAccount = setup.contas[0]?.id ?? '';
        if (!this.goalAccountId()) {
          this.goalAccountId.set(firstAccount);
        }
        if (!this.settingsAccountId()) {
          this.settingsAccountId.set(firstAccount);
          this.loadSettingsForAccount(firstAccount);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os dados.');
        this.loading.set(false);
      },
    });
  }

  onAccountScopeChange(scope: PurchaseAccountScope): void {
    this.accountScope.set(scope);
    this.refreshGoals();
  }

  onSettingsAccountChange(accountId: string): void {
    this.settingsAccountId.set(accountId);
    this.loadSettingsForAccount(accountId);
  }

  loadSettingsForAccount(accountId: string): void {
    if (!accountId) {
      this.reservaInput.set('');
      return;
    }

    this.possoComprarService.getSettings(accountId).subscribe({
      next: (settings) => {
        this.reservaInput.set(
          settings.reservaDisponivel != null ? String(settings.reservaDisponivel).replace('.', ',') : '',
        );
      },
      error: () => this.reservaInput.set(''),
    });
  }

  saveReserva(): void {
    const accountId = this.settingsAccountId();
    if (!accountId) {
      this.actionError.set('Selecione a conta para salvar a reserva.');
      return;
    }

    const parsed = this.reservaInput().trim() ? parseMoneyInput(this.reservaInput()) : null;
    if (this.reservaInput().trim() && parsed == null) {
      this.actionError.set('Informe um valor de reserva válido.');
      return;
    }

    this.saving.set(true);
    this.actionError.set(null);

    this.possoComprarService
      .upsertSettings({
        accountId,
        reservaDisponivel: parsed,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.refreshGoals();
        },
        error: (err) => {
          this.saving.set(false);
          this.actionError.set(err.error?.mensagem ?? 'Erro ao salvar reserva.');
        },
      });
  }

  addGoal(): void {
    if (!this.hasFinancialAccounts()) {
      this.actionError.set('Vincule uma conta financeira antes de simular compras.');
      return;
    }

    const valor = parseMoneyInput(this.valorAlvo());
    if (valor == null || valor <= 0) {
      this.actionError.set('Informe o valor da compra.');
      return;
    }

    const entrada = parseMoneyInput(this.valorEntrada()) ?? 0;
    const accountId = this.goalAccountId();
    if (!accountId) {
      this.actionError.set('Selecione a conta financeira.');
      return;
    }

    const body: CreatePurchaseGoalRequest = {
      accountId,
      titulo: this.titulo().trim(),
      descricao: this.descricao().trim() || undefined,
      valorAlvo: valor,
      valorEntrada: Math.max(0, entrada),
      dataDesejada: this.dataDesejada() || undefined,
      prioridadeUsuario: this.prioridade(),
      modoPagamento: this.modoPagamento(),
    };

    if (this.modoPagamento() === 'Parcelado') {
      const parcelas = Number(this.numParcelas());
      if (!Number.isFinite(parcelas) || parcelas <= 0) {
        this.actionError.set('Informe o número de parcelas.');
        return;
      }
      body.numParcelas = parcelas;
    }

    if (!body.titulo) {
      this.actionError.set('Informe o que você deseja comprar.');
      return;
    }

    this.saving.set(true);
    this.actionError.set(null);

    this.possoComprarService.createGoal(body).subscribe({
      next: () => {
        this.titulo.set('');
        this.descricao.set('');
        this.valorAlvo.set('');
        this.valorEntrada.set('');
        this.dataDesejada.set('');
        this.numParcelas.set('');
        this.saving.set(false);
        if (this.isCompactUi()) {
          this.simulationFormOpen.set(false);
        }
        this.evaluateAll(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(err.error?.mensagem ?? 'Erro ao criar simulação.');
      },
    });
  }

  evaluateAll(useAi = true): void {
    this.evaluating.set(true);
    this.actionError.set(null);

    this.possoComprarService
      .evaluateAll({
        accountScope: this.accountScope(),
        usarIa: useAi,
      })
      .subscribe({
        next: (data) => {
          this.list.set(data);
          this.evaluating.set(false);
        },
        error: (err) => {
          this.evaluating.set(false);
          this.actionError.set(err.error?.mensagem ?? 'Erro ao avaliar compras.');
          this.refreshGoals();
        },
      });
  }

  removeGoal(goal: PurchaseGoal): void {
    if (!confirm(`Remover a simulação "${goal.titulo}"?`)) {
      return;
    }

    this.possoComprarService.deleteGoal(goal.id).subscribe({
      next: () => this.refreshGoals(),
      error: (err) => this.actionError.set(err.error?.mensagem ?? 'Erro ao excluir.'),
    });
  }

  refreshGoals(): void {
    this.possoComprarService.listGoals(this.accountScope()).subscribe({
      next: (data) => this.list.set(data),
      error: () => this.actionError.set('Erro ao atualizar lista.'),
    });
  }

  vereditoClass(veredito?: string | null): string {
    const v = (veredito ?? '').toLowerCase();
    if (v === 'saudavel') return 'posso-comprar-badge--saudavel';
    if (v === 'atencao') return 'posso-comprar-badge--atencao';
    return 'posso-comprar-badge--arriscado';
  }

  vereditoLabel(veredito?: string | null): string {
    if (!veredito) return 'Não avaliado';
    if (veredito === 'Saudavel') return 'Saudável';
    if (veredito === 'Atencao') return 'Atenção';
    if (veredito === 'Arriscado') return 'Arriscado';
    return veredito;
  }

  /** Explica o índice 0–100 gerado pelas regras do app (não é score de crédito). */
  scoreTitulo(): string {
    return 'Índice de saúde financeira';
  }

  scoreResumo(score: number): string {
    if (score >= 75) return 'Confortável para o seu orçamento';
    if (score >= 50) return 'Possível, mas exige atenção';
    return 'Pesa bastante no orçamento';
  }

  valorMensalTitulo(meta: PurchaseGoal): string {
    return meta.modoPagamento === 'Parcelado'
      ? 'Parcela mensal estimada'
      : 'Quanto guardar por mês';
  }

  valorMensalExplicacao(meta: PurchaseGoal): string {
    if (meta.modoPagamento === 'Parcelado') {
      return 'Valor aproximado de cada parcela com base no que falta pagar.';
    }
    if (meta.poupancaMensalSugerida === 0) {
      return 'Sua reserva ou entrada já cobrem o valor — não precisa guardar todo mês.';
    }
    return 'Sugestão de quanto separar por mês até completar o valor da compra.';
  }

  prazoTitulo(meta: PurchaseGoal): string {
    return meta.modoPagamento === 'Parcelado' ? 'Duração do parcelamento' : 'Tempo para juntar o valor';
  }

  prazoTexto(meta: PurchaseGoal): string {
    const meses = meta.mesesEstimados;
    if (meses == null) return '—';
    if (meses === 0) return 'Compra viável agora (com reserva/entrada)';
    if (meses === 1) return 'Cerca de 1 mês';
    return `Cerca de ${meses} meses`;
  }

  prazoExplicacao(meta: PurchaseGoal): string {
    if (meta.modoPagamento === 'Parcelado') {
      return 'Quantidade de meses em que as parcelas devem ser pagas.';
    }
    if (meta.mesesEstimados === 0) {
      return 'Com o dinheiro que você já tem guardado ou de entrada.';
    }
    if (meta.dataDesejada) {
      return 'Calculado até a data que você informou, se couber na sua sobra mensal.';
    }
    return 'Estimativa com base na sua capacidade de poupança mensal.';
  }

  rankLabel(ordem: number): string {
    return `${ordem}º na fila — o que avaliar ou adiar primeiro`;
  }
}
