import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { BrandLogoComponent } from '../../../shared/components/brand-logo/brand-logo.component';
import { ApiErrorResponse } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, BrandLogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('registered') === 'true') {
      this.successMessage.set('Conta criada com sucesso. Faça login para continuar.');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    if (this.loading() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.apiError.set(null);
    this.successMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.apiError.set(this.resolveErrorMessage(error));
      },
    });
  }

  protected getFieldError(field: 'email' | 'password'): string | null {
    const control = this.form.controls[field];

    if (!control.touched && !control.dirty) {
      return null;
    }

    if (field === 'email') {
      if (control.hasError('required')) {
        return 'Informe seu e-mail.';
      }
      if (control.hasError('email')) {
        return 'Informe um e-mail válido.';
      }
    }

    if (field === 'password' && control.hasError('required')) {
      return 'Informe sua senha.';
    }

    return null;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const body = error.error as ApiErrorResponse | undefined;

    if (body?.mensagem) {
      return body.mensagem;
    }

    if (error.status === 401 || error.status === 400) {
      return 'Não foi possível realizar o login. Verifique seu e-mail e senha.';
    }

    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor. Tente novamente em instantes.';
    }

    return 'Não foi possível realizar o login. Tente novamente.';
  }
}
