import { FetchBackend } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { LangService } from './core/services/lang.service';

// Exercise the production providers: a mock loader would hide a broken registration.
describe('AppComponent translations', () => {
  beforeEach(() => {
    localStorage.removeItem('sabrikom_lang');
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        // Angular 17 prefers FetchBackend over the testing HttpBackend.
        { provide: FetchBackend, useExisting: HttpTestingController }
      ]
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.removeItem('sabrikom_lang');
  });

  it('renders Arabic labels and switches to French with the correct direction', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/i18n/ar.json').flush({ app: { name: 'صابريكم' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('صابريكم');
    expect(document.documentElement.dir).toBe('rtl');

    TestBed.inject(LangService).switchLang('fr');
    http.expectOne('/i18n/fr.json').flush({ app: { name: 'Sabrikom' } });
    fixture.detectChanges();
    expect(TestBed.inject(TranslateService).instant('app.name')).toBe('Sabrikom');
    expect(fixture.nativeElement.textContent).toContain('Sabrikom');
    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
