import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, TranslateModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>{{ 'auth.register_title' | translate }}</h1>
        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        <form (ngSubmit)="submit()">
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'auth.first_name' | translate }}</label>
              <input class="form-control" [(ngModel)]="form.firstName" name="firstName" required />
            </div>
            <div class="form-group">
              <label>{{ 'auth.last_name' | translate }}</label>
              <input class="form-control" [(ngModel)]="form.lastName" name="lastName" required />
            </div>
          </div>
          <div class="form-group">
            <label>{{ 'auth.email' | translate }}</label>
            <input class="form-control" type="email" [(ngModel)]="form.email" name="email" required />
          </div>
          <div class="form-group">
            <label>{{ 'auth.password' | translate }}</label>
            <input class="form-control" type="password" [(ngModel)]="form.password" name="password" required minlength="8" />
          </div>
          <div class="form-group">
            <label>{{ 'auth.phone' | translate }}</label>
            <input class="form-control" [(ngModel)]="form.phoneNumber" name="phone" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'auth.country' | translate }}</label>
              <select class="form-control" [(ngModel)]="form.country" name="country">
                <option value="DZ">🇩🇿 Algérie</option>
                <option value="MA">🇲🇦 Maroc</option>
                <option value="TN">🇹🇳 Tunisie</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'auth.city' | translate }}</label>
              <input class="form-control" [(ngModel)]="form.city" name="city" required />
            </div>
          </div>
          <div class="form-group">
            <label>{{ 'auth.role' | translate }}</label>
            <select class="form-control" [(ngModel)]="form.role" name="role">
              <option value="Buyer">{{ 'auth.role_buyer' | translate }}</option>
              <option value="Seller">{{ 'auth.role_seller' | translate }}</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width:100%" type="submit" [disabled]="loading()">
            {{ 'auth.register_btn' | translate }}
          </button>
        </form>
        <p class="auth-link">
          {{ 'auth.have_account' | translate }}
          <a routerLink="/auth/login">{{ 'nav.login' | translate }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display:flex; justify-content:center; align-items:center; min-height:80vh; padding:2rem; }
    .auth-card { background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); padding:2rem; width:100%; max-width:500px; }
    .auth-card h1 { margin-bottom:1.5rem; text-align:center; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .auth-link { text-align:center; margin-top:1rem; font-size:0.9rem; }
    @media(max-width:480px) { .form-row { grid-template-columns:1fr; } }
  `]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  form = { firstName:'', lastName:'', email:'', password:'', phoneNumber:'', country:'DZ', city:'', role:'Buyer' };
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true); this.error.set('');
    this.auth.register(this.form).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => { this.error.set(e.error?.message || 'Erreur'); this.loading.set(false); }
    });
  }
}
