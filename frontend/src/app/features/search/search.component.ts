import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListingService } from '../../core/services/listing.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LangService } from '../../core/services/lang.service';
import { Listing, Category, Brand, VehicleModel, PagedResult } from '../../core/models';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="padding-top:2rem; padding-bottom:2rem;">
      <div class="search-layout">

        <!-- Filters sidebar -->
        <aside class="filters-panel">
          <h3>{{ 'search.filters' | translate }}</h3>

          <div class="form-group">
            <label>{{ 'home.brand' | translate }}</label>
            <select class="form-control" [(ngModel)]="params.brandId" (change)="onBrandChange()">
              <option [ngValue]="undefined">—</option>
              @for (b of brands(); track b.id) {
                <option [ngValue]="b.id">{{ b.name }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>{{ 'home.model' | translate }}</label>
            <select class="form-control" [(ngModel)]="params.vehicleModelId" [disabled]="!params.brandId">
              <option [ngValue]="undefined">—</option>
              @for (m of models(); track m.id) {
                <option [ngValue]="m.id">{{ m.name }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>{{ 'home.year' | translate }}</label>
            <input class="form-control" type="number" [(ngModel)]="params.year"
              min="1980" [max]="currentYear" placeholder="ex: 2018" />
          </div>

          <div class="form-group">
            <label>{{ 'listing.category' | translate }}</label>
            <select class="form-control" [(ngModel)]="params.categoryId">
              <option [ngValue]="undefined">—</option>
              @for (c of categories(); track c.id) {
                <option [ngValue]="c.id">{{ lang.currentLang() === 'ar' ? c.nameAr : c.nameFr }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>{{ 'search.condition' | translate }}</label>
            <select class="form-control" [(ngModel)]="params.condition">
              <option value="">{{ 'search.all_conditions' | translate }}</option>
              <option value="New">{{ 'listing.new' | translate }}</option>
              <option value="Used">{{ 'listing.used' | translate }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ 'listing.country' | translate }}</label>
            <select class="form-control" [(ngModel)]="params.country">
              <option value="">—</option>
              <option value="DZ">🇩🇿 {{ 'common.dz' | translate }}</option>
              <option value="MA">🇲🇦 {{ 'common.ma' | translate }}</option>
              <option value="TN">🇹🇳 {{ 'common.tn' | translate }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ 'search.min_price' | translate }}</label>
            <input class="form-control" type="number" [(ngModel)]="params.minPrice" min="0" />
          </div>
          <div class="form-group">
            <label>{{ 'search.max_price' | translate }}</label>
            <input class="form-control" type="number" [(ngModel)]="params.maxPrice" min="0" />
          </div>

          <button class="btn btn-primary" style="width:100%" (click)="applyFilters()">
            🔍 {{ 'home.search_btn' | translate }}
          </button>
          <button class="btn btn-secondary" style="width:100%; margin-top:0.5rem" (click)="resetFilters()">
            ✕ Reset
          </button>
        </aside>

        <!-- Results -->
        <main class="results-panel">
          <div class="results-header">
            <div>
              <h2>{{ 'search.title' | translate }}</h2>
              @if (!loading()) {
                <p class="results-count">
                  {{ result()?.totalCount || 0 }} {{ 'search.results_count' | translate }}
                </p>
              }
            </div>
            <div class="sort-row">
              <label>{{ 'search.sort_by' | translate }}</label>
              <select class="form-control" [(ngModel)]="params.sortBy" (change)="applyFilters()">
                <option value="date_desc">{{ 'search.sort_date' | translate }}</option>
                <option value="price_asc">{{ 'search.sort_price_asc' | translate }}</option>
                <option value="price_desc">{{ 'search.sort_price_desc' | translate }}</option>
              </select>
            </div>
          </div>

          <!-- Search bar -->
          <div class="search-bar-row">
            <input class="form-control" [(ngModel)]="params.query"
              [placeholder]="'home.search_placeholder' | translate"
              (keyup.enter)="applyFilters()" />
            <input class="form-control" [(ngModel)]="params.oemReference"
              [placeholder]="'home.oem_placeholder' | translate"
              (keyup.enter)="applyFilters()" />
          </div>

          @if (loading()) {
            <div class="loading-center"><div class="spinner"></div></div>
          } @else if (result()?.items?.length === 0) {
            <div class="no-results">
              <p>{{ 'search.no_results' | translate }}</p>
            </div>
          } @else {
            <div class="grid-3">
              @for (listing of result()?.items; track listing.id) {
                <a class="listing-card" [routerLink]="['/listings', listing.id]">
                  <div class="listing-card-img">
                    @if (listing.photos.length > 0) {
                      <img [src]="listing.photos[0].thumbnailUrl || listing.photos[0].url"
                        [alt]="lang.currentLang() === 'ar' ? listing.titleAr : listing.titleFr" loading="lazy" />
                    } @else { 🔧 }
                  </div>
                  <div class="listing-card-body">
                    <div class="listing-card-title">
                      {{ lang.currentLang() === 'ar' ? listing.titleAr : listing.titleFr }}
                    </div>
                    <div class="listing-card-price">{{ listing.price | number }} {{ listing.currency }}</div>
                    <div class="listing-card-meta">
                      <span class="badge" [class]="'badge-' + listing.condition.toLowerCase()">
                        {{ ('listing.' + listing.condition.toLowerCase()) | translate }}
                      </span>
                      <span>📍 {{ listing.city }}</span>
                      @if (listing.brandName) { <span>🚗 {{ listing.brandName }}</span> }
                    </div>
                  </div>
                </a>
              }
            </div>

            <!-- Pagination -->
            @if ((result()?.totalPages || 0) > 1) {
              <div class="pagination">
                <button [disabled]="params.page === 1" (click)="goPage((params.page || 1) - 1)">
                  ‹
                </button>
                @for (p of pages(); track p) {
                  <button [class.active]="p === params.page" (click)="goPage(p)">{{ p }}</button>
                }
                <button [disabled]="params.page === result()?.totalPages" (click)="goPage((params.page || 1) + 1)">
                  ›
                </button>
              </div>
            }
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .search-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .filters-panel {
      background: #fff;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 1.2rem;
      position: sticky;
      top: 80px;
    }
    .filters-panel h3 { margin-bottom: 1rem; font-size: 1rem; }
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .results-count { color: var(--text-light); font-size: 0.9rem; }
    .sort-row { display: flex; align-items: center; gap: 0.5rem; }
    .sort-row label { white-space: nowrap; font-size: 0.9rem; }
    .sort-row .form-control { width: auto; }
    .search-bar-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .search-bar-row .form-control { flex: 1; min-width: 200px; }
    .no-results {
      text-align: center;
      padding: 3rem;
      color: var(--text-light);
      font-size: 1.1rem;
    }
    @media (max-width: 768px) {
      .search-layout { grid-template-columns: 1fr; }
      .filters-panel { position: static; }
    }
  `]
})
export class SearchComponent implements OnInit {
  private listingService = inject(ListingService);
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lang = inject(LangService);

  result = signal<PagedResult<Listing> | null>(null);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  models = signal<VehicleModel[]>([]);
  loading = signal(true);
  currentYear = new Date().getFullYear();

  params: any = { page: 1, pageSize: 12, sortBy: 'date_desc' };

  ngOnInit() {
    this.catalogService.getCategories().subscribe(c => this.categories.set(c));
    this.catalogService.getBrands().subscribe(b => this.brands.set(b));

    this.route.queryParams.subscribe(qp => {
      this.params = { page: 1, pageSize: 12, sortBy: 'date_desc', ...qp };
      if (this.params.brandId) {
        this.catalogService.getModels(+this.params.brandId).subscribe(m => this.models.set(m));
      }
      this.loadResults();
    });
  }

  onBrandChange() {
    this.params.vehicleModelId = undefined;
    this.models.set([]);
    if (this.params.brandId) {
      this.catalogService.getModels(+this.params.brandId).subscribe(m => this.models.set(m));
    }
  }

  applyFilters() {
    this.params.page = 1;
    this.router.navigate([], { queryParams: this.cleanParams(), replaceUrl: true });
  }

  resetFilters() {
    this.params = { page: 1, pageSize: 12, sortBy: 'date_desc' };
    this.models.set([]);
    this.loadResults();
  }

  goPage(p: number) {
    this.params.page = p;
    this.loadResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pages(): number[] {
    const total = this.result()?.totalPages || 1;
    const cur = this.params.page || 1;
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, cur + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  private loadResults() {
    this.loading.set(true);
    this.listingService.search(this.cleanParams()).subscribe(r => {
      this.result.set(r);
      this.loading.set(false);
    });
  }

  private cleanParams() {
    const p: any = {};
    Object.entries(this.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p[k] = v;
    });
    return p;
  }
}
