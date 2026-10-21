import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { LangService } from './core/services/lang.service';

describe('AppComponent translations', () => {
  let http: HttpTestingController;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: LangService, useValue: { init: () => {}, currentLang: signal('ar') } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    translate = TestBed.inject(TranslateService);
    http.expectOne('/i18n/ar.json').flush({ app: { name: 'صابريكم' } });
  });

  afterEach(() => http.verify());

  it('renders the translated brand in the real app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.brand-name').textContent).toBe('صابريكم');
  });

  it('loads French through the configured HTTP loader', () => {
    translate.use('fr').subscribe();
    http.expectOne('/i18n/fr.json').flush({ nav: { search: 'Rechercher' } });
    expect(translate.instant('nav.search')).toBe('Rechercher');
  });
});
