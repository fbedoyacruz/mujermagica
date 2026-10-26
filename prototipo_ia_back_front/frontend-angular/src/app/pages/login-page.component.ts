import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="auth-wrap">
      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-card">
        <h1>RaaS Prototipo</h1>
        <p>Inventario interno - acceso administrativo</p>

        <label>
          Usuario
          <input formControlName="username" />
        </label>

        <label>
          Clave
          <input type="password" formControlName="password" />
        </label>

        <button type="submit" [disabled]="loading">{{ loading ? 'Ingresando...' : 'Ingresar' }}</button>
        <small class="hint">Usuario inicial: admin | Clave: admin123</small>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>
    </section>
  `,
  styles: [
    `.auth-wrap{min-height:100vh;display:grid;place-items:center;background:linear-gradient(145deg,#fff7ed,#ecfeff 50%,#eff6ff);}`,
    `.auth-card{width:min(420px,92vw);background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 60px rgba(15,23,42,.12);}`,
    `h1{margin:0;font-size:28px;} p{margin:0;color:#64748b;} label{display:flex;flex-direction:column;gap:6px;font-weight:600;font-size:14px;}`,
    `input{border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:14px;} button{margin-top:4px;border:0;border-radius:10px;padding:11px 12px;background:#0f172a;color:#fff;font-weight:700;}`,
    `.hint{color:#334155;} .error{color:#b91c1c;font-weight:600;}`
  ]
})
export class LoginPageComponent {
  loading = false;
  error = '';

  form = this.fb.group({
    username: ['admin', Validators.required],
    password: ['admin123', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.error = '';

    this.authService.login(this.form.getRawValue() as { username: string; password: string }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.loading = false;
        this.error = 'Credenciales inválidas o backend no disponible.';
      }
    });
  }
}
