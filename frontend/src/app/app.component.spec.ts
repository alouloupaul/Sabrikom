import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { LangService } from './core/services/lang.service';

describe('AppComponent translations', () => {
  let get: jasmine.Spy;
  let translate: TranslateService;

  beforeEach(() => {
    get = jasmine.createSpy('get').and.callFake((url: string) => of(
      url === '/i18n/ar.json' ? { app: { name: 'صابريكم' } } : { nav: { search: 'Rechercher' } }
    ));
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        ...appConfig.providers,
        { provide: HttpClient, useValue: { get } },
        { provide: LangService, useValue: { init: () => {}, currentLang: signal('ar') } }
      ]
    });
    translate = TestBed.inject(TranslateService);
    translate.use('ar').subscribe();
  });

  it('renders the translated brand in the real app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.brand-name').textContent).toBe('صابريكم');
  });

  it('loads French through the configured HTTP loader', () => {
    translate.use('fr').subscribe();
    expect(get).toHaveBeenCalledWith('/i18n/fr.json');
    expect(translate.instant('nav.search')).toBe('Rechercher');
  });
});
