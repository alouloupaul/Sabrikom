import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ListingService } from '../../core/services/listing.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LangService } from '../../core/services/lang.service';
import { Listing, AdminStats, PagedResult, UserProfile } from '../../core/models';

type AdminTab = 'listings' | 'users' | 'stats';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslateModule, CommonModule],
  template: `
    <div class="container" style="padding:2rem 1rem">
      <h1>{{ 'admin.title' | translate }}</h1>

      <!-- Tabs -->
      <div class="admin-tabs">
        <button [class.active]="tab() === 'stats'" (click)="tab.set('stats')">
          📊 {{ 'admin.stats' | translate }}
        </button>
        <button [class.active]="tab() === 'listings'" (click)="tab.set('listings'); loadListings()">
          📋 {{ 'admin.listings' | translate }}
          @if (stats()?.pendingListings) {
            <span class="tab-badge">{{ stats()!.pendingListings }}</span>
          }
        </button>
        <button [class.active]="tab() === 'users'" (click)="tab.set('users'); loadUsers()">
          👥 {{ 'admin.users' | translate }}
        </button>
      </div>

      <!-- Stats tab -->
      @if (tab() === 'stats' && stats()) {
        <div class="stats-grid">
          <div class="stat-card"><span class="stat-num">{{ stats()!.totalListings }}</span><span class="stat-label">{{ 'admin.total_listings' | translate }}</span></div>
          <div class="stat-card pending"><span class="stat-num">{{ stats()!.pendingListings }}</span><span class="stat-label">{{ 'dashboard.pending' | translate }}</span></div>
          <div class="stat-card"><span class="stat-num">{{ stats()!.publishedListings }}</span><span class="stat-label">{{ 'dashboard.active' | translate }}</span></div>
          <div class="stat-card"><span class="stat-num">{{ stats()!.totalUsers }}</span><span class="stat-label">{{ 'admin.total_users' | translate }}</span></div>
          <div class="stat-card"><span class="stat-num">{{ stats()!.totalSellers }}</span><span class="stat-label">{{ 'admin.total_sellers' | translate }}</span></div>
          <div class="stat-card"><span class="stat-num">{{ stats()!.totalMessages }}</span><span class="stat-label">{{ 'admin.total_messages' | translate }}</span></div>
        </div>
      }

      <!-- Listings tab -->
      @if (tab() === 'listings') {
        <div class="filter-row">
          <select class="form-control" [(ngModel)]="listingStatusFilter" (change)="loadListings()" style="width:auto">
            <option value="">Tous</option>
            <option value="Pending">En attente</option>
            <option value="Published">Publiés</option>
            <option value="Rejected">Rejetés</option>
          </select>
        </div>

        @if (listingsLoading()) {
          <div class="loading-center"><div class="spinner"></div></div>
        } @else {
          <div class="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Annonce</th>
                  <th>Vendeur</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (l of listings()?.items; track l.id) {
                  <tr>
                    <td>
                      <a [routerLink]="['/listings', l.id]" class="listing-link">
                        {{ lang.currentLang() === 'ar' ? l.titleAr : l.titleFr }}
                      </a>
                    </td>
                    <td>{{ l.sellerName }}</td>
                    <td>{{ l.price | number }} {{ l.currency }}</td>
                    <td><span class="badge" [class]="'badge-' + l.status.toLowerCase()">{{ l.status }}</span></td>
                    <td>{{ l.createdAt | date:'dd/MM/yy' }}</td>
                    <td class="action-cell">
                      @if (l.status === 'Pending') {
                        <button class="btn btn-sm" style="background:#28a745;color:#fff" (click)="validate(l.id, true)">
                          ✓ {{ 'admin.approve' | translate }}
                        </button>
                        <button class="btn btn-danger btn-sm" (click)="openReject(l.id)">
                          ✗ {{ 'admin.reject' | translate }}
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Reject modal -->
        @if (rejectListingId()) {
          <div class="modal-overlay" (click)="rejectListingId.set(null)">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3>{{ 'admin.reject' | translate }}</h3>
              <div class="form-group">
                <label>{{ 'admin.rejection_reason' | translate }}</label>
                <textarea class="form-control" [(ngModel)]="rejectionReason" rows="3"></textarea>
              </div>
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="rejectListingId.set(null)">{{ 'common.cancel' | translate }}</button>
                <button class="btn btn-danger" (click)="validate(rejectListingId()!, false)">{{ 'admin.reject' | translate }}</button>
              </div>
            </div>
          </div>
        }
      }

      <!-- Users tab -->
      @if (tab() === 'users') {
        @if (usersLoading()) {
          <div class="loading-center"><div class="spinner"></div></div>
        } @else {
          <div class="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Pays</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users()?.items; track u.id) {
                  <tr>
                    <td>{{ u.firstName }} {{ u.lastName }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.role }}</td>
                    <td>{{ u.country }}</td>
                    <td>
                      <span class="badge" [class]="u.isActive ? 'badge-published' : 'badge-rejected'">
                        {{ u.isActive ? 'Actif' : 'Suspendu' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm" [class]="u.isActive ? 'btn-danger' : 'btn-primary'" (click)="toggleUser(u.id)">
                        {{ u.isActive ? ('admin.suspend' | translate) : ('admin.activate' | translate) }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .admin-tabs { display:flex; gap:0.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    .admin-tabs button { padding:0.5rem 1.2rem; border:1px solid var(--border); background:#fff; border-radius:var(--radius); cursor:pointer; font-size:0.9rem; position:relative; }
    .admin-tabs button.active { background:var(--primary); color:#fff; border-color:var(--primary); }
    .tab-badge { background:#dc3545; color:#fff; border-radius:50%; padding:0.1rem 0.4rem; font-size:0.75rem; margin-inline-start:0.4rem; }
    .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:2rem; }
    .stat-card { background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); padding:1.5rem; text-align:center; }
    .stat-card.pending { border-top:3px solid #ffc107; }
    .stat-num { display:block; font-size:2.2rem; font-weight:700; color:var(--primary); }
    .stat-label { font-size:0.85rem; color:var(--text-light); }
    .filter-row { margin-bottom:1rem; }
    .admin-table { background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); overflow:auto; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:0.75rem 1rem; text-align:start; border-bottom:1px solid var(--border); font-size:0.9rem; }
    th { background:#f9f9f9; font-weight:600; }
    .listing-link { color:var(--primary); text-decoration:none; font-weight:600; }
    .action-cell { display:flex; gap:0.4rem; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:2000; }
    .modal { background:#fff; border-radius:var(--radius); padding:2rem; width:100%; max-width:440px; }
    .modal h3 { margin-bottom:1rem; }
    .modal-actions { display:flex; gap:0.75rem; justify-content:flex-end; margin-top:1rem; }
    @media(max-width:600px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
  `]
})
export class AdminComponent implements OnInit {
  private listingService = inject(ListingService);
  private catalogService = inject(CatalogService);
  lang = inject(LangService);

  tab = signal<AdminTab>('stats');
  stats = signal<AdminStats | null>(null);
  listings = signal<PagedResult<Listing> | null>(null);
  users = signal<PagedResult<UserProfile> | null>(null);
  listingsLoading = signal(false);
  usersLoading = signal(false);
  listingStatusFilter = '';
  rejectListingId = signal<number | null>(null);
  rejectionReason = '';

  ngOnInit() {
    this.catalogService.getStats().subscribe(s => this.stats.set(s));
  }

  loadListings() {
    this.listingsLoading.set(true);
    this.listingService.adminGetAll(1, 50, this.listingStatusFilter || undefined).subscribe(r => {
      this.listings.set(r);
      this.listingsLoading.set(false);
    });
  }

  loadUsers() {
    this.usersLoading.set(true);
    this.catalogService.getUsers().subscribe(r => {
      this.users.set(r);
      this.usersLoading.set(false);
    });
  }

  validate(id: number, approve: boolean) {
    this.listingService.validate(id, approve, approve ? undefined : this.rejectionReason).subscribe(() => {
      this.rejectListingId.set(null);
      this.rejectionReason = '';
      this.loadListings();
      this.catalogService.getStats().subscribe(s => this.stats.set(s));
    });
  }

  openReject(id: number) {
    this.rejectListingId.set(id);
    this.rejectionReason = '';
  }

  toggleUser(id: string) {
    this.catalogService.toggleUser(id).subscribe(() => this.loadUsers());
  }
}
