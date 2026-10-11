import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

interface Feature {
  tag: string;
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
      title: 'Registre no Telegram',
      description:
        'Descreva gastos e receitas em linguagem natural. O GranaFlow interpreta e organiza para você.',
      highlight: 'Mercado 85 reais',
    },
    {
      number: '02',
      title: 'Confirme em segundos',
      description:
        'Revise valor, categoria e descrição antes de salvar. Sem planilhas, sem fricção.',
    },
    {
      number: '03',
      title: 'Veja tudo no painel',
      description:
        'Saldo, movimentações e contexto financeiro atualizados — inclusive em tempo real após cada lançamento.',
    },
  ];

  protected readonly features: Feature[] = [
    {
      tag: 'Gastos',
      title: 'Despesas sob controle',
      description: 'Registre e acompanhe para onde o dinheiro está indo.',
    },
    {
      tag: 'Receitas',
      title: 'Entradas visíveis',
      description: 'Tenha clareza do que entra na sua conta ou na conta conjunta.',
    },
    {
      tag: 'Painel',
      title: 'Visão consolidada',
      description: 'Saldo e movimentações recentes em um único lugar.',
    },
    {
      tag: 'Telegram',
      title: 'Integração nativa',
      description: 'Lance pelo app que você já usa no dia a dia.',
    },
    {
      tag: 'Contas',
      title: 'Pessoal e conjunta',
      description: 'Cada membro vê o que importa, com regras de acesso claras.',
    },
    {
      tag: 'Metas',
      title: 'Planejamento',
      description: 'Em breve: objetivos financeiros com acompanhamento de progresso.',
    },
  ];
}
