import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

export type Lang = 'ar' | 'fr';

@Injectable({ providedIn: 'root' })
export class LangService {
  private translate = inject(TranslateService);
  private document = inject(DOCUMENT);

  readonly currentLang = signal<Lang>(this.loadLang());
  readonly isRtl = () => this.currentLang() === 'ar';

  init() {
    this.translate.addLangs(['ar', 'fr']);
    this.translate.setDefaultLang('ar');
    this.applyLang(this.currentLang());
  }

  switchLang(lang: Lang) {
    this.currentLang.set(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sabrikom_lang', lang);
    }
    this.applyLang(lang);
  }

  private applyLang(lang: Lang) {
    this.translate.use(lang);
    const html = this.document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }

  private loadLang(): Lang {
    if (typeof localStorage === 'undefined') return 'ar';
    return (localStorage.getItem('sabrikom_lang') as Lang) ?? 'ar';
  }
}
