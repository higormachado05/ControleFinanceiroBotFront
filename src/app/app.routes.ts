import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { GastosComponent } from './features/gastos/gastos.component';
import { PlanejamentoComponent } from './features/planejamento/planejamento.component';
import { PossoComprarComponent } from './features/posso-comprar/posso-comprar.component';
import { PreferenciasComponent } from './features/preferencias/preferencias.component';
import { ReceitasComponent } from './features/receitas/receitas.component';
import { LinkTelegramComponent } from './features/auth/link-telegram/link-telegram.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LandingComponent } from './pages/landing/landing.component';
import { AppShellComponent } from './shared/layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    canActivate: [guestGuard],
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'cadastro',
    component: RegisterComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'ativar-conta',
    component: LinkTelegramComponent,
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Dashboard', eyebrow: 'Visão geral' },
      },
      {
        path: 'gastos',
        component: GastosComponent,
        data: { title: 'Gastos', eyebrow: 'Despesas' },
      },
      {
        path: 'receitas',
        component: ReceitasComponent,
        data: { title: 'Receitas', eyebrow: 'Entradas' },
      },
      {
        path: 'planejamento',
        component: PlanejamentoComponent,
        data: { title: 'Planejamento', eyebrow: 'Orçamento' },
      },
      {
        path: 'posso-comprar',
        component: PossoComprarComponent,
        data: { title: 'Posso Comprar?', eyebrow: 'Simulador' },
      },
      {
        path: 'preferencias',
        component: PreferenciasComponent,
        data: { title: 'Preferências', eyebrow: 'Conta' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
