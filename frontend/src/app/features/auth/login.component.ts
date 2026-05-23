import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, TranslateModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>{{ 'auth.login_title' | translate }}</h1>
        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label>{{ 'auth.email' | translate }}</label>
            <input class="form-control" type="email" [(ngModel)]="email" name="email" required />
          </div>
          <div class="form-group">
            <label>{{ 'auth.password' | translate }}</label>
            <input class="form-control" type="password" [(ngModel)]="password" name="password" required />
          </div>
          <button class="btn btn-primary" style="width:100%" type="submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner" style="width:16px;height:16px;border-width:2px"></span> }
            {{ 'auth.login_btn' | translate }}
          </button>
        </form>
        <p class="auth-link">
          {{ 'auth.no_account' | translate }}
          <a routerLink="/auth/register">{{ 'nav.register' | translate }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display:flex; justify-content:center; align-items:center; min-height:80vh; padding:2rem; }
    .auth-card { background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); padding:2rem; width:100%; max-width:420px; }
    .auth-card h1 { margin-bottom:1.5rem; text-align:center; }
    .auth-link { text-align:center; margin-top:1rem; font-size:0.9rem; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = ''; password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true); this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => { this.error.set(e.error?.message || 'Erreur de connexion'); this.loading.set(false); }
    });
  }
}
