import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';

@Component({ standalone: true, template: '' })
class TestPage {}

describe('Listing routes', () => {
  let seller: boolean;

  beforeEach(() => {
    seller = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes.map(route => {
          if (!route.loadComponent) return route;
          const { loadComponent, ...config } = route;
          return { ...config, component: TestPage };
        })),
        { provide: AuthService, useValue: { isSeller: () => seller } }
      ]
    });
  });

  it('opens the creation route instead of treating new as a listing ID', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/listings/new');
    expect(TestBed.inject(Router).routerState.snapshot.root.firstChild?.routeConfig?.path)
      .toBe('listings/new');
  });

  it('still guards listing creation', async () => {
    seller = false;
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/listings/new');
    expect(TestBed.inject(Router).url).toBe('/auth/login');
  });

  it('still opens listing details', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/listings/123');
    expect(TestBed.inject(Router).routerState.snapshot.root.firstChild?.params['id']).toBe('123');
  });
});
