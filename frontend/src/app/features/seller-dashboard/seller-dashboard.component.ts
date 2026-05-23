import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ListingService } from '../../core/services/listing.service';
import { LangService } from '../../core/services/lang.service';
import { Listing, PagedResult } from '../../core/models';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [RouterLink, TranslateModule, CommonModule],
  template: `
    <div class="container" style="padding:2rem 1rem">
      <div class="dash-header">
        <h1>{{ 'dashboard.seller_title' | translate }}</h1>
        <a routerLink="/listings/new" class="btn btn-primary">
          + {{ 'dashboard.add_listing' | translate }}
        </a>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-num">{{ countByStatus('Published') }}</span>
          <span class="stat-label">{{ 'dashboard.active' | translate }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ countByStatus('Pending') }}</span>
          <span class="stat-label">{{ 'dashboard.pending' | translate }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ countByStatus('Rejected') }}</span>
          <span class="stat-label">{{ 'dashboard.rejected' | translate }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ countByStatus('Expired') }}</span>
          <span class="stat-label">{{ 'dashboard.expired' | translate }}</span>
        </div>
      </div>

      <!-- Listings table -->
      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else {
        <div class="listings-table">
          <table>
            <thead>
              <tr>
                <th>{{ 'listing.photos' | translate }}</th>
                <th>Titre</th>
                <th>{{ 'listing.price' | translate }}</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (l of result()?.items; track l.id) {
                <tr>
                  <td>
                    @if (l.photos.length > 0) {
                      <img [src]="l.photos[0].thumbnailUrl || l.photos[0].url" class="table-thumb" />
                    } @else { 🔧 }
                  </td>
                  <td>
                    <a [routerLink]="['/listings', l.id]">
                      {{ lang.currentLang() === 'ar' ? l.titleAr : l.titleFr }}
                    </a>
                    @if (l.rejectionReason) {
                      <p class="rejection-reason">⚠️ {{ l.rejectionReason }}</p>
                    }
                  </td>
                  <td>{{ l.price | number }} {{ l.currency }}</td>
                  <td><span class="badge" [class]="'badge-' + l.status.toLowerCase()">{{ l.status }}</span></td>
                  <td>{{ l.createdAt | date:'dd/MM/yy' }}</td>
                  <td class="actions">
                    <a [routerLink]="['/listings', l.id, 'edit']" class="btn btn-secondary btn-sm">✏️</a>
                    <button class="btn btn-danger btn-sm" (click)="deleteListing(l.id)">🗑️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .dash-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
    .stat-card { background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); padding:1.2rem; text-align:center; }
    .stat-num { display:block; font-size:2rem; font-weight:700; color:var(--primary); }
    .stat-label { font-size:0.85rem; color:var(--text-light); }
    .listings-table { background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); overflow:auto; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:0.75rem 1rem; text-align:start; border-bottom:1px solid var(--border); font-size:0.9rem; }
    th { background:#f9f9f9; font-weight:600; }
    .table-thumb { width:50px; height:50px; object-fit:cover; border-radius:4px; }
    .actions { display:flex; gap:0.4rem; }
    .rejection-reason { font-size:0.8rem; color:#dc3545; margin-top:0.2rem; }
    @media(max-width:600px) { .stats-row { grid-template-columns:repeat(2,1fr); } }
  `]
})
export class SellerDashboardComponent implements OnInit {
  private listingService = inject(ListingService);
  lang = inject(LangService);
  result = signal<PagedResult<Listing> | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.load();
  }

  load() {
    this.listingService.myListings(1, 50).subscribe(r => {
      this.result.set(r);
      this.loading.set(false);
    });
  }

  countByStatus(status: string): number {
    return this.result()?.items.filter(l => l.status === status).length ?? 0;
  }

  deleteListing(id: number) {
    if (!confirm('Confirmer la suppression ?')) return;
    this.listingService.delete(id).subscribe(() => this.load());
  }
}
