import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse, UserProfile } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<AuthResponse | null>(this.loadFromStorage());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'Admin');
  readonly isSeller = computed(() => this._user()?.role === 'Seller' || this._user()?.role === 'Admin');

  register(data: {
    firstName: string; lastName: string; email: string; password: string;
    phoneNumber: string; country: string; city: string; role: string;
  }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  refresh() {
    const stored = this._user();
    if (!stored) return;
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken: stored.refreshToken }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/']);
  }

  getProfile() {
    return this.http.get<UserProfile>(`${environment.apiUrl}/auth/me`);
  }

  getAccessToken(): string | null {
    return this._user()?.accessToken ?? null;
  }

  private saveSession(res: AuthResponse) {
    this._user.set(res);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sabrikom_session', JSON.stringify(res));
    }
  }

  private clearSession() {
    this._user.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sabrikom_session');
    }
  }

  private loadFromStorage(): AuthResponse | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('sabrikom_session');
    return raw ? JSON.parse(raw) : null;
  }
}
