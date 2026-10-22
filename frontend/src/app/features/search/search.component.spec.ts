import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { SearchComponent } from './search.component';
import { ListingService } from '../../core/services/listing.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LangService } from '../../core/services/lang.service';

describe('Search navigation and recovery', () => {
  let component: SearchComponent;
  let queryParams: Subject<Record<string, string>>;
  let search: jasmine.Spy;
  let navigate: jasmine.Spy;
  const emptyResult = { items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 10 };

  beforeEach(() => {
    queryParams = new Subject();
    search = jasmine.createSpy('search').and.returnValue(of(emptyResult));
    navigate = jasmine.createSpy('navigate');
    TestBed.configureTestingModule({ providers: [
      { provide: ActivatedRoute, useValue: { queryParams } },
      { provide: Router, useValue: { navigate } },
      { provide: ListingService, useValue: { search } },
      { provide: CatalogService, useValue: {
        getCategories: () => of([]), getBrands: () => of([]), getModels: () => of([])
      } },
      { provide: LangService, useValue: {} }
    ] });
    component = TestBed.runInInjectionContext(() => new SearchComponent());
    component.ngOnInit();
  });

  it('uses numeric URL pages for the pagination window', () => {
    queryParams.next({ page: '2' });
    expect(component.pages()).toEqual([1, 2, 3, 4]);
  });

  it('clears filters in the URL, not just in memory', () => {
    queryParams.next({ query: 'brake', page: '2' });
    component.resetFilters();
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { page: 1, pageSize: 12, sortBy: 'date_desc' }, replaceUrl: true
    });
  });

  it('keeps the current filters in the URL when changing pages', () => {
    queryParams.next({ query: 'brake' });
    component.goPage(2);
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { page: 2, pageSize: 12, sortBy: 'date_desc', query: 'brake' }
    });
  });

  it('ends loading on failure and can retry the same search', () => {
    search.and.returnValue(throwError(() => new Error('offline')));
    queryParams.next({ query: 'brake' });
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeTrue();
    expect(component.result()).toBeNull();

    search.and.returnValue(of(emptyResult));
    component.loadResults();
    expect(component.error()).toBeFalse();
    expect(component.loading()).toBeFalse();
    expect(component.result()).toEqual(emptyResult);
    expect(search.calls.mostRecent().args[0].query).toBe('brake');
  });
});
