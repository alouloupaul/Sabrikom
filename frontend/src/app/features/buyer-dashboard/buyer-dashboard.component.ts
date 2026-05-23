import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ListingService } from '../../core/services/listing.service';
import { LangService } from '../../core/services/lang.service';
import { Listing, PagedResult } from '../../core/models';

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [RouterLink, TranslateModule, CommonModule],
  template: `
    <div class="container" style="padding:2rem 1rem">
      <h1>{{ 'dashboard.my_favorites' | translate }}</h1>
      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else if (result()?.items?.length === 0) {
        <div style="text-align:center;padding:3rem;color:var(--text-light)">
          <p>Aucun favori pour l'instant.</p>
          <a routerLink="/search" class="btn btn-primary" style="margin-top:1rem">
            {{ 'nav.search' | translate }}
          </a>
        </div>
      } @else {
        <div class="grid-4">
          @for (l of result()?.items; track l.id) {
            <a class="listing-card" [routerLink]="['/listings', l.id]">
              <div class="listing-card-img">
                @if (l.photos.length > 0) {
                  <img [src]="l.photos[0].thumbnailUrl || l.photos[0].url"
                    [alt]="lang.currentLang() === 'ar' ? l.titleAr : l.titleFr" loading="lazy" />
                } @else { 🔧 }
              </div>
              <div class="listing-card-body">
                <div class="listing-card-title">
                  {{ lang.currentLang() === 'ar' ? l.titleAr : l.titleFr }}
                </div>
                <div class="listing-card-price">{{ l.price | number }} {{ l.currency }}</div>
                <div class="listing-card-meta">
                  <span class="badge" [class]="'badge-' + l.condition.toLowerCase()">
                    {{ ('listing.' + l.condition.toLowerCase()) | translate }}
                  </span>
                  <span>📍 {{ l.city }}</span>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `
})
export class BuyerDashboardComponent implements OnInit {
  private listingService = inject(ListingService);
  lang = inject(LangService);
  result = signal<PagedResult<Listing> | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.listingService.getFavorites().subscribe(r => {
      this.result.set(r);
      this.loading.set(false);
    });
  }
}
