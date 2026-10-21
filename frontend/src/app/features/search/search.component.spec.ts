import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { SearchComponent } from './search.component';
import { ListingService } from '../../core/services/listing.service';
import { CatalogService } from '../../core/services/catalog.service';

const emptyResult = { items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 8 };

describe('Search navigation and recovery', () => {
  let component: SearchComponent;
  let queryParams: BehaviorSubject<any>;
  let search: jasmine.Spy;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    queryParams = new BehaviorSubject<any>({ query: 'frein', brandId: '1', page: '2' });
    search = jasmine.createSpy('search').and.returnValue(of(emptyResult));
    navigate = jasmine.createSpy('navigate');
    TestBed.configureTestingModule({
      imports: [SearchComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams } },
        { provide: Router, useValue: { navigate } },
        { provide: ListingService, useValue: { search } },
        { provide: CatalogService, useValue: {
          getCategories: () => of([]), getBrands: () => of([]), getModels: () => of([])
        } }
      ]
    });
    component = TestBed.createComponent(SearchComponent).componentInstance;
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('treats URL page numbers as numbers for pagination', () => {
    expect(component.params.page).toBe(2);
    expect(component.pages()).toEqual([1, 2, 3, 4]);
  });

  it('writes pagination to the URL, preserving filters', () => {
    spyOn(window, 'scrollTo');
    component.goPage(3);
    expect(navigate).toHaveBeenCalledWith([], { queryParams: jasmine.objectContaining({ page: 3, query: 'frein' }) });
  });

  it('clears the URL when resetting filters', () => {
    component.resetFilters();
    expect(navigate).toHaveBeenCalledWith([], { queryParams: {} });
    queryParams.next({});
    expect(search).toHaveBeenCalledWith({ page: 1, pageSize: 12, sortBy: 'date_desc' });
    expect(component.models()).toEqual([]);
  });

  it('keeps filter changes in browser history', () => {
    component.applyFilters();
    expect(navigate).toHaveBeenCalledWith([], { queryParams: jasmine.objectContaining({ page: 1 }) });
  });

  it('ends the spinner on failure and can retry successfully', () => {
    search.and.returnValue(throwError(() => new Error('offline')));
    component.loadResults();
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeTrue();
    expect(component.result()).toBeNull();
    search.and.returnValue(of(emptyResult));
    component.loadResults();
    expect(component.error()).toBeFalse();
    expect(component.result()).toEqual(emptyResult);
  });

  it('does not let a stale request replace newer search results', () => {
    const oldSearch = new Subject<any>();
    search.and.returnValue(oldSearch);
    component.loadResults();
    search.and.returnValue(of(emptyResult));
    queryParams.next({ query: 'moteur' });
    oldSearch.next({ ...emptyResult, totalCount: 99 });
    expect(component.result()?.totalCount).toBe(0);
  });
});
