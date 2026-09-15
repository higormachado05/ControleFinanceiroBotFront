import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { formatCurrency, formatDate, isReceita } from '../../core/utils/format.utils';
import { DashboardRealtimeService } from './dashboard-realtime.service';
import { DashboardService } from './dashboard.service';
import { DashboardSummary, RecentTransaction } from './models/dashboard.models';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly dashboardRealtime = inject(DashboardRealtimeService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly sidebarOpen = signal(false);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly transactions = signal<RecentTransaction[]>([]);

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '▦', route: '/dashboard', active: true },
    { label: 'Gastos', icon: '↓', disabled: true },
    { label: 'Receitas', icon: '↑', disabled: true },
    { label: 'Contas', icon: '◫', disabled: true },
    { label: 'Metas', icon: '◎', disabled: true },
    { label: 'Telegram', icon: '✦', disabled: true },
    { label: 'Configurações', icon: '⚙', disabled: true },
  ];

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly isReceita = isReceita;

  ngOnInit(): void {
    this.loadDashboard();
    this.dashboardRealtime.connect(() => this.loadDashboard(true));
  }

  ngOnDestroy(): void {
    this.dashboardRealtime.disconnect();
  }

  loadDashboard(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);

    forkJoin({
      summary: this.dashboardService.getSummary(),
      transactions: this.dashboardService.getRecentTransactions(undefined, 10),
    }).subscribe({
      next: ({ summary, transactions }) => {
        this.summary.set(summary);
        this.transactions.set(transactions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar seus dados.');
      },
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  transactionMeta(transaction: RecentTransaction): string {
    const parts: string[] = [];

    if (transaction.categoria) {
      parts.push(transaction.categoria);
    }

    if (transaction.usuario?.nome) {
      parts.push(`Lançado por ${transaction.usuario.nome}`);
    }

    return parts.join(' · ');
  }

  signedAmount(transaction: RecentTransaction): string {
    const prefix = isReceita(transaction.tipo) ? '+' : '-';
    return `${prefix}${formatCurrency(transaction.valor)}`;
  }
}
