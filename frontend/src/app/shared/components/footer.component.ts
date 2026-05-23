import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslateModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <span class="brand-icon">🔧</span>
          <span>{{ 'app.name' | translate }}</span>
          <p>{{ 'app.tagline' | translate }}</p>
        </div>
        <div class="footer-links">
          <a routerLink="/search">{{ 'nav.search' | translate }}</a>
          <a routerLink="/auth/register">{{ 'nav.register' | translate }}</a>
          <a routerLink="/auth/login">{{ 'nav.login' | translate }}</a>
        </div>
        <div class="footer-countries">
          <span>🇩🇿 {{ 'common.dz' | translate }}</span>
          <span>🇲🇦 {{ 'common.ma' | translate }}</span>
          <span>🇹🇳 {{ 'common.tn' | translate }}</span>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2024 Sabrikom. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #1a1a2e;
      color: #aaa;
      margin-top: 3rem;
    }
    .footer-inner {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      padding: 2rem 1rem;
      justify-content: space-between;
    }
    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }
    .footer-brand p { font-size: 0.85rem; font-weight: 400; color: #aaa; }
    .brand-icon { font-size: 1.4rem; }
    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .footer-links a {
      color: #aaa;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .footer-links a:hover { color: #e94560; }
    .footer-countries {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.9rem;
    }
    .footer-bottom {
      border-top: 1px solid #333;
      text-align: center;
      padding: 1rem;
      font-size: 0.8rem;
    }
  `]
})
export class FooterComponent {}
