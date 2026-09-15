import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErrorResponse } from '../../../core/models/auth.models';

const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-link-telegram',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './link-telegram.component.html',
  styleUrl: './link-telegram.component.css',
})
export class LinkTelegramComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly apiError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      conviteCode: ['', [Validators.required, Validators.maxLength(20)]],
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] },
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    if (this.loading() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.apiError.set(null);

    this.authService.linkTelegramAccount(this.form.getRawValue()).subscribe({
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

  protected getFieldError(
    field: 'conviteCode' | 'nome' | 'email' | 'password' | 'confirmPassword',
  ): string | null {
    const control = this.form.controls[field];

    if (!control.touched && !control.dirty) {
      return null;
    }

    if (field === 'conviteCode' && control.hasError('required')) {
      return 'Informe o código de convite do Telegram.';
    }

    if (field === 'nome' && control.hasError('required')) {
      return 'Informe seu nome como aparece no Telegram.';
    }

    if (field === 'email') {
      if (control.hasError('required')) {
        return 'Informe seu e-mail.';
      }
      if (control.hasError('email')) {
        return 'Informe um e-mail válido.';
      }
    }

    if (field === 'password') {
      if (control.hasError('required')) {
        return 'Informe sua senha.';
      }
      if (control.hasError('minlength')) {
        return `A senha deve possuir pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
      }
    }

    if (field === 'confirmPassword') {
      if (control.hasError('required')) {
        return 'Confirme sua senha.';
      }
      if (this.form.hasError('passwordMismatch') && control.touched) {
        return 'As senhas não coincidem.';
      }
    }

    return null;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const body = error.error as ApiErrorResponse | undefined;

    if (body?.mensagem) {
      return body.mensagem;
    }

    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor. Tente novamente em instantes.';
    }

    return 'Não foi possível ativar sua conta. Verifique os dados informados.';
  }
}

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}
