import { Component, input } from '@angular/core';
import { BRAND_LOGO_ALT, BRAND_LOGO_URL } from '../../../core/constants/brand.constants';

export type BrandLogoVariant = 'header' | 'footer' | 'auth' | 'sidebar';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <span [class]="'brand-logo-wrap brand-logo-wrap--' + variant()">
      <img
        class="brand-logo"
        [src]="logoUrl"
        [alt]="alt()"
        width="500"
        height="500"
        decoding="async"
        [attr.loading]="lazy() ? 'lazy' : 'eager'"
      />
    </span>
  `,
})
export class BrandLogoComponent {
  readonly variant = input<BrandLogoVariant>('header');
  readonly alt = input(BRAND_LOGO_ALT);
  readonly lazy = input(true);

  protected readonly logoUrl = BRAND_LOGO_URL;
}
