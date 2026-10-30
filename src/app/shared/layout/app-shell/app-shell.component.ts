import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardRefreshService } from '../../../core/services/dashboard-refresh.service';
import { DashboardRealtimeService } from '../../../features/dashboard/dashboard-realtime.service';
import { BrandLogoComponent } from '../../components/brand-logo/brand-logo.component';
import { NavIconComponent, NavIconName } from '../../components/nav-icon/nav-icon.component';

interface ShellNavItem {
  label: string;
  icon: NavIconName;
  route?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavIconComponent, BrandLogoComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardRealtime = inject(DashboardRealtimeService);
  private readonly dashboardRefresh = inject(DashboardRefreshService);
  protected readonly authService = inject(AuthService);

  protected readonly sidebarOpen = signal(false);
  protected readonly headerEyebrow = signal('Visão geral');
  protected readonly headerTitle = signal('Dashboard');

  private routeSubscription?: Subscription;

  protected readonly navItems: ShellNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Gastos', icon: 'expense', route: '/gastos' },
    { label: 'Receitas', icon: 'income', route: '/receitas' },
    { label: 'Planejamento', icon: 'planning', route: '/planejamento' },
    { label: 'Posso Comprar?', icon: 'goals', route: '/posso-comprar' },
    { label: 'Preferências', icon: 'settings', route: '/preferencias' },
  ];

  ngOnInit(): void {
    this.syncHeaderFromRoute();
    this.routeSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.syncHeaderFromRoute());

    this.dashboardRealtime.connect(() => this.dashboardRefresh.requestRefresh());
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.dashboardRealtime.disconnect();
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

  private syncHeaderFromRoute(): void {
    let child = this.route.snapshot;
    while (child.firstChild) {
      child = child.firstChild;
    }

    this.headerEyebrow.set((child.data['eyebrow'] as string) ?? 'GranaFlow');
    this.headerTitle.set((child.data['title'] as string) ?? 'Painel');
  }
}
