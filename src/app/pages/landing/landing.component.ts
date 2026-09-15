import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
  highlight?: string;
}

@Component({
  selector: 'app-landing',
  imports: [HeaderComponent, FooterComponent, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  protected readonly steps: Step[] = [
    {
      number: '01',
      title: 'Registre de onde estiver',
      description:
        'Use o Telegram ou o painel web para registrar suas movimentações em segundos.',
      highlight: 'Mercado 85 reais',
    },
    {
      number: '02',
      title: 'Seus dados são organizados',
      description:
        'O GranaFlow registra e organiza suas movimentações financeiras automaticamente.',
    },
    {
      number: '03',
      title: 'Acompanhe pelo painel',
      description: 'Visualize gastos, receitas, saldo e evolução financeira em um só lugar.',
    },
  ];

  protected readonly features: Feature[] = [
    {
      icon: '💸',
      title: 'Controle de gastos',
      description: 'Registre e acompanhe seus gastos.',
    },
    {
      icon: '💰',
      title: 'Controle de receitas',
      description: 'Tenha uma visão clara de tudo que entra.',
    },
    {
      icon: '📊',
      title: 'Dashboard financeiro',
      description: 'Visualize receitas, gastos, saldo e evolução.',
    },
    {
      icon: '🤖',
      title: 'Análise financeira',
      description: 'Receba insights sobre seus hábitos financeiros.',
    },
    {
      icon: '📱',
      title: 'Integração com Telegram',
      description: 'Registre movimentações rapidamente pelo Telegram.',
    },
    {
      icon: '🎯',
      title: 'Metas financeiras',
      description: 'Defina objetivos e acompanhe sua evolução.',
    },
  ];
}
