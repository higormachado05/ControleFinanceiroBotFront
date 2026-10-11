import { Component, input } from '@angular/core';

export type NavIconName =
  | 'dashboard'
  | 'expense'
  | 'income'
  | 'accounts'
  | 'goals'
  | 'telegram'
  | 'settings';

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  template: `
    <svg
      class="nav-icon"
      [class.nav-icon--active]="active()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('dashboard') {
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        }
        @case ('expense') {
          <path d="M12 5v14" />
          <path d="M19 12l-7 7-7-7" />
        }
        @case ('income') {
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        }
        @case ('accounts') {
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        }
        @case ('goals') {
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        }
        @case ('telegram') {
          <path d="M21 5L2 12.5l7 2.5L18 9l-8.5 5.5v4L14 16l7-11z" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        }
      }
    </svg>
  `,
  styles: `
    .nav-icon {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
      color: var(--color-text-muted);
    }

    .nav-icon--active {
      color: var(--color-primary);
    }
  `,
})
export class NavIconComponent {
  readonly name = input.required<NavIconName>();
  readonly active = input(false);
}
