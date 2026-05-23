import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, CommonModule],
  template: `
    <nav class="navbar">
      <div class="container navbar-inner">
        <!-- Logo -->
        <a routerLink="/" class="navbar-brand">
          <span class="brand-icon">🔧</span>
          <span class="brand-name">{{ 'app.name' | translate }}</span>
        </a>

        <!-- Mobile toggle -->
        <button class="mobile-toggle" (click)="menuOpen.set(!menuOpen())">
          <span></span><span></span><span></span>
        </button>

        <!-- Links -->
        <div class="navbar-links" [class.open]="menuOpen()">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            {{ 'nav.home' | translate }}
          </a>
          <a routerLink="/search" routerLinkActive="active">
            {{ 'nav.search' | translate }}
          </a>

          @if (auth.isSeller()) {
            <a routerLink="/listings/new" class="btn-sell">
              + {{ 'nav.sell' | translate }}
            </a>
          }

          @if (auth.isLoggedIn()) {
            <a routerLink="/messages" routerLinkActive="active">
              {{ 'nav.messages' | translate }}
            </a>
            <a routerLink="/favorites" routerLinkActive="active">
              {{ 'nav.favorites' | translate }}
            </a>
            <a routerLink="/dashboard" routerLinkActive="active">
              {{ 'nav.dashboard' | translate }}
            </a>
            @if (auth.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="active">
                {{ 'nav.admin' | translate }}
              </a>
            }
            <button class="btn-logout" (click)="auth.logout()">
              {{ 'nav.logout' | translate }}
            </button>
          } @else {
            <a routerLink="/auth/login" routerLinkActive="active">
              {{ 'nav.login' | translate }}
            </a>
            <a routerLink="/auth/register" class="btn-register">
              {{ 'nav.register' | translate }}
            </a>
          }

          <!-- Language switcher -->
          <div class="lang-switcher">
            <button [class.active]="lang.currentLang() === 'ar'" (click)="lang.switchLang('ar')">ع</button>
            <button [class.active]="lang.currentLang() === 'fr'" (click)="lang.switchLang('fr')">FR</button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: #1a1a2e;
      color: #fff;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #fff;
      font-size: 1.4rem;
      font-weight: 700;
    }
    .brand-icon { font-size: 1.6rem; }
    .brand-name { color: #e94560; }
    .navbar-links {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .navbar-links a {
      color: #ccc;
      text-decoration: none;
      font-size: 0.95rem;
      transition: color 0.2s;
    }
    .navbar-links a:hover, .navbar-links a.active { color: #fff; }
    .btn-sell {
      background: #e94560;
      color: #fff !important;
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-weight: 600;
    }
    .btn-register {
      border: 1px solid #e94560;
      color: #e94560 !important;
      padding: 0.4rem 1rem;
      border-radius: 20px;
    }
    .btn-logout {
      background: none;
      border: none;
      color: #ccc;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .btn-logout:hover { color: #e94560; }
    .lang-switcher {
      display: flex;
      gap: 0.25rem;
      margin-inline-start: 0.5rem;
    }
    .lang-switcher button {
      background: transparent;
      border: 1px solid #555;
      color: #ccc;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .lang-switcher button.active {
      background: #e94560;
      border-color: #e94560;
      color: #fff;
    }
    .mobile-toggle {
      display: none;
      flex-direction: column;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
    }
    .mobile-toggle span {
      display: block;
      width: 24px;
      height: 2px;
      background: #fff;
      border-radius: 2px;
    }
    @media (max-width: 768px) {
      .mobile-toggle { display: flex; }
      .navbar-links {
        display: none;
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        padding: 0.5rem 0;
      }
      .navbar-links.open { display: flex; }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  lang = inject(LangService);
  menuOpen = signal(false);
}
