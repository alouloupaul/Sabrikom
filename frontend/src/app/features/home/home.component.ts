import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { ListingService } from '../../core/services/listing.service';
import { LangService } from '../../core/services/lang.service';
import { Category, Brand, VehicleModel, Listing } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <h1>{{ 'home.hero_title' | translate }}</h1>
        <p>{{ 'home.hero_subtitle' | translate }}</p>

        <!-- Search tabs -->
        <div class="search-tabs">
          <button [class.active]="searchTab() === 'vehicle'" (click)="searchTab.set('vehicle')">
            {{ 'home.search_by_vehicle' | translate }}
          </button>
          <button [class.active]="searchTab() === 'oem'" (click)="searchTab.set('oem')">
            {{ 'home.search_by_oem' | translate }}
          </button>
        </div>

        <div class="search-box">
          @if (searchTab() === 'vehicle') {
            <select class="form-control" [(ngModel)]="selectedBrandId" (change)="onBrandChange()">
              <option value="">{{ 'home.brand' | translate }}</option>
              @for (b of brands(); track b.id) {
                <option [value]="b.id">{{ b.name }}</option>
              }
            </select>
            <select class="form-control" [(ngModel)]="selectedModelId" [disabled]="!selectedBrandId">
              <option value="">{{ 'home.model' | translate }}</option>
              @for (m of models(); track m.id) {
                <option [value]="m.id">{{ m.name }}</option>
              }
            </select>
            <input class="form-control" type="number" [(ngModel)]="selectedYear"
              [placeholder]="'home.year' | translate" min="1980" [max]="currentYear" />
          } @else {
            <input class="form-control oem-input" [(ngModel)]="oemQuery"
              [placeholder]="'home.oem_placeholder' | translate" />
          }
          <button class="btn btn-primary search-btn" (click)="doSearch()">
            🔍 {{ 'home.search_btn' | translate }}
          </button>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="section container">
      <h2 class="section-title">{{ 'home.categories_title' | translate }}</h2>
      <div class="categories-grid">
        @for (cat of categories(); track cat.id) {
          <a class="category-card" [routerLink]="['/search']" [queryParams]="{categoryId: cat.id}">
            <span class="cat-icon">{{ cat.icon || '🔩' }}</span>
            <span class="cat-name">{{ lang.currentLang() === 'ar' ? cat.nameAr : cat.nameFr }}</span>
          </a>
        }
      </div>
    </section>

    <!-- Latest listings -->
    <section class="section container">
      <div class="section-header">
        <h2 class="section-title">{{ 'home.latest_title' | translate }}</h2>
        <a routerLink="/search" class="btn btn-secondary btn-sm">{{ 'home.view_all' | translate }}</a>
      </div>
      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else {
        <div class="grid-4">
          @for (listing of latestListings(); track listing.id) {
            <a class="listing-card" [routerLink]="['/listings', listing.id]">
              <div class="listing-card-img">
                @if (listing.photos.length > 0) {
                  <img [src]="listing.photos[0].thumbnailUrl || listing.photos[0].url" [alt]="lang.currentLang() === 'ar' ? listing.titleAr : listing.titleFr" loading="lazy" />
                } @else {
                  🔧
                }
              </div>
              <div class="listing-card-body">
                <div class="listing-card-title">
                  {{ lang.currentLang() === 'ar' ? listing.titleAr : listing.titleFr }}
                </div>
                <div class="listing-card-price">
                  {{ listing.price | number }} {{ listing.currency }}
                </div>
                <div class="listing-card-meta">
                  <span class="badge" [class]="'badge-' + listing.condition.toLowerCase()">
                    {{ ('listing.' + listing.condition.toLowerCase()) | translate }}
                  </span>
                  <span>📍 {{ listing.city }}</span>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #fff;
      padding: 4rem 0 3rem;
      text-align: center;
    }
    .hero h1 { color: #fff; margin-bottom: 0.8rem; }
    .hero p { color: #ccc; margin-bottom: 2rem; font-size: 1.1rem; }
    .search-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .search-tabs button {
      background: transparent;
      border: 1px solid #555;
      color: #ccc;
      padding: 0.4rem 1.2rem;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .search-tabs button.active {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
    }
    .search-box {
      display: flex;
      gap: 0.75rem;
      max-width: 800px;
      margin: 0 auto;
      flex-wrap: wrap;
      justify-content: center;
    }
    .search-box .form-control {
      flex: 1;
      min-width: 160px;
      max-width: 220px;
    }
    .oem-input { max-width: 400px !important; }
    .search-btn { white-space: nowrap; }
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
    }
    .category-card {
      background: #fff;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 1.2rem 0.8rem;
      text-align: center;
      text-decoration: none;
      color: var(--text);
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .category-card:hover {
      box-shadow: var(--shadow-hover);
      transform: translateY(-3px);
      color: var(--primary);
    }
    .cat-icon { font-size: 2rem; }
    .cat-name { font-size: 0.85rem; font-weight: 600; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .section-header .section-title { margin-bottom: 0; }
  `]
})
export class HomeComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private listingService = inject(ListingService);
  private router = inject(Router);
  lang = inject(LangService);

  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  models = signal<VehicleModel[]>([]);
  latestListings = signal<Listing[]>([]);
  loading = signal(true);

  searchTab = signal<'vehicle' | 'oem'>('vehicle');
  selectedBrandId: number | '' = '';
  selectedModelId: number | '' = '';
  selectedYear: number | '' = '';
  oemQuery = '';
  currentYear = new Date().getFullYear();

  ngOnInit() {
    this.catalogService.getCategories().subscribe(c => this.categories.set(c));
    this.catalogService.getBrands().subscribe(b => this.brands.set(b));
    this.listingService.search({ page: 1, pageSize: 8 }).subscribe(r => {
      this.latestListings.set(r.items);
      this.loading.set(false);
    });
  }

  onBrandChange() {
    this.selectedModelId = '';
    this.models.set([]);
    if (this.selectedBrandId) {
      this.catalogService.getModels(+this.selectedBrandId).subscribe(m => this.models.set(m));
    }
  }

  doSearch() {
    if (this.searchTab() === 'oem') {
      this.router.navigate(['/search'], { queryParams: { oemReference: this.oemQuery } });
    } else {
      const params: any = {};
      if (this.selectedBrandId) params['brandId'] = this.selectedBrandId;
      if (this.selectedModelId) params['vehicleModelId'] = this.selectedModelId;
      if (this.selectedYear) params['year'] = this.selectedYear;
      this.router.navigate(['/search'], { queryParams: params });
    }
  }
}
