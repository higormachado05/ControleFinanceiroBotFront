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
import { BrandLogoComponent } from '../../../shared/components/brand-logo/brand-logo.component';
import { ApiErrorResponse } from '../../../core/models/auth.models';

const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, BrandLogoComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly apiError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
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

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/login'], {
          queryParams: { registered: 'true' },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.apiError.set(this.resolveErrorMessage(error));
      },
    });
  }

  protected getFieldError(
    field: 'nome' | 'email' | 'password' | 'confirmPassword',
  ): string | null {
    const control = this.form.controls[field];

    if (!control.touched && !control.dirty) {
      return null;
    }

    if (field === 'nome' && control.hasError('required')) {
      return 'Informe seu nome.';
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

    if (error.status === 409 || error.status === 400) {
      return 'Não foi possível criar sua conta. Verifique os dados informados.';
    }

    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor. Tente novamente em instantes.';
    }

    return 'Não foi possível criar sua conta. Tente novamente.';
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
