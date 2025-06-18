import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Giriş Yap</h2>

        <!-- Development Info -->
        <div class="dev-info mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p class="text-sm text-blue-700 mb-1"><strong>Development Ortamı</strong></p>
          <p class="text-xs text-blue-600">Admin: admin / 1q2w3E*</p>
        </div>

        <!-- SSO Login Button -->
        <button
          (click)="loginWithSSO()"
          class="btn btn-primary mb-4 w-full">
          ABP Framework ile Giriş Yap
        </button>

        <div class="divider">veya</div>

        <!-- Traditional Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Kullanıcı Adı / E-posta</label>
            <input
              type="text"
              id="email"
              formControlName="email"
              class="form-control"
              placeholder="admin"
            />
          </div>

          <div class="form-group">
            <label for="password">Şifre</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              placeholder="1q2w3E*"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-secondary" [disabled]="isLoading">
              {{ isLoading ? 'Giriş yapılıyor...' : 'Kullanıcı Adı/Şifre ile Giriş' }}
            </button>
          </div>

          <!-- Quick Login Buttons -->
          <div class="quick-login mt-3">
            <button
              type="button"
              (click)="quickLogin()"
              class="btn btn-outline btn-sm w-full">
              Hızlı Admin Girişi
            </button>
          </div>
        </form>

        <div class="alert alert-danger" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  constructor() {
    // Validasyonları kaldırdık ve default değerler eklendi
    this.loginForm = this.fb.group({
      email: ['admin'], // Default admin
      password: ['1q2w3E*'] // Default şifre
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // SSO Login (Authorization Code Flow)
  loginWithSSO(): void {
    this.authService.loginWithAuthorizationCode();
  }

  // Quick admin login
  quickLogin(): void {
    this.loginForm.patchValue({
      email: 'admin',
      password: '1q2w3E*'
    });
    this.onSubmit();
  }

  // Password Grant Login - Validasyon kontrolü kaldırıldı
  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginWithPassword(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error_description || 'Giriş yapılırken hata oluştu';
      }
    });
  }
}