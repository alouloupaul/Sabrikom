import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { CatalogService } from './core/services/catalog.service';
import { ListingFormComponent } from './features/listing-form/listing-form.component';
import { LoginComponent } from './features/auth/login.component';

describe('Create listing route', () => {
  let seller: boolean;

  beforeEach(() => {
    seller = true;
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        provideRouter(routes), provideHttpClient(),
        { provide: AuthService, useValue: { isSeller: () => seller } },
        { provide: CatalogService, useValue: { getCategories: () => of([]), getBrands: () => of([]) } }
      ]
    });
  });

  it('opens the creation form rather than treating new as a listing id', async () => {
    const harness = await RouterTestingHarness.create();
    const form = await harness.navigateByUrl('/listings/new', ListingFormComponent);
    expect(form.isEdit).toBeFalse();
    expect(harness.routeNativeElement?.querySelector('form')).toBeTruthy();
  });

  it('still requires a seller session', async () => {
    seller = false;
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/listings/new', LoginComponent);
    expect(TestBed.inject(Router).url).toBe('/auth/login');
  });
});
