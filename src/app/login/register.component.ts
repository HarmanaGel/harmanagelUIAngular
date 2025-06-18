import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { RegisterRequest } from '../shared/models/user-model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Kayıt Ol</h2>
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Ad</label>
              <input
                type="text"
                id="firstName"
                formControlName="firstName"
                class="form-control"
                [class.is-invalid]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
              />
              <div class="invalid-feedback" *ngIf="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched">
                Ad gereklidir
              </div>
            </div>

            <div class="form-group">
              <label for="lastName">Soyad</label>
              <input
                type="text"
                id="lastName"
                formControlName="lastName"
                class="form-control"
                [class.is-invalid]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
              />
              <div class="invalid-feedback" *ngIf="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched">
                Soyad gereklidir
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="email">E-posta</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              [class.is-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
            />
            <div class="invalid-feedback" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              Geçerli bir e-posta adresi giriniz
            </div>
          </div>

          <div class="form-group">
            <label for="password">Şifre</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              [class.is-invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
            />
            <div class="invalid-feedback" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              Şifre en az 6 karakter olmalıdır
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Şifre Tekrar</label>
            <input
              type="password"
              id="confirmPassword"
              formControlName="confirmPassword"
              class="form-control"
              [class.is-invalid]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
            />
            <div class="invalid-feedback" *ngIf="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched">
              Şifreler eşleşmiyor
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="registerForm.invalid || isLoading">
              {{ isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol' }}
            </button>
          </div>

          <div class="auth-links">
            <a routerLink="/login">Zaten hesabınız var mı? Giriş yapın</a>
          </div>
        </form>

        <div class="alert alert-danger" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData: RegisterRequest = { ...this.registerForm.value };
      delete (formData as any).confirmPassword;

      this.authService.register(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.router.navigate(['/']);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || error.error?.error_description || 'Kayıt yapılırken hata oluştu';
        }
      });
    }
  }
}