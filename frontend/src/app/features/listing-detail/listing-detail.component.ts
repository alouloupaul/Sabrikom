import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListingService } from '../../core/services/listing.service';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { LangService } from '../../core/services/lang.service';
import { Listing } from '../../core/models';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="loading-center"><div class="spinner"></div></div>
    } @else if (!listing()) {
      <div class="container" style="padding:3rem; text-align:center">
        <p>{{ 'common.error' | translate }}</p>
        <a routerLink="/search" class="btn btn-primary">{{ 'nav.search' | translate }}</a>
      </div>
    } @else {
      <div class="container detail-layout">

        <!-- Photos gallery -->
        <div class="gallery">
          <div class="main-photo">
            @if (listing()!.photos.length > 0) {
              <img [src]="listing()!.photos[activePhoto()].url"
                [alt]="lang.currentLang() === 'ar' ? listing()!.titleAr : listing()!.titleFr" />
            } @else {
              <div class="no-photo">🔧</div>
            }
          </div>
          @if (listing()!.photos.length > 1) {
            <div class="thumbnails">
              @for (photo of listing()!.photos; track photo.id; let i = $index) {
                <img [src]="photo.thumbnailUrl || photo.url" [class.active]="i === activePhoto()"
                  (click)="activePhoto.set(i)" loading="lazy" />
              }
            </div>
          }
        </div>

        <!-- Info panel -->
        <div class="info-panel">
          <div class="info-header">
            <span class="badge" [class]="'badge-' + listing()!.condition.toLowerCase()">
              {{ ('listing.' + listing()!.condition.toLowerCase()) | translate }}
            </span>
            <span class="badge badge-published">
              {{ ('listing.status_' + listing()!.status.toLowerCase()) | translate }}
            </span>
          </div>

          <h1>{{ lang.currentLang() === 'ar' ? listing()!.titleAr : listing()!.titleFr }}</h1>

          <div class="price">
            {{ listing()!.price | number }} {{ listing()!.currency }}
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">{{ 'listing.category' | translate }}</span>
              <span>{{ lang.currentLang() === 'ar' ? listing()!.categoryNameAr : listing()!.categoryNameFr }}</span>
            </div>
            @if (listing()!.brandName) {
              <div class="meta-item">
                <span class="meta-label">{{ 'home.brand' | translate }}</span>
                <span>{{ listing()!.brandName }}</span>
              </div>
            }
            @if (listing()!.vehicleModelName) {
              <div class="meta-item">
                <span class="meta-label">{{ 'home.model' | translate }}</span>
                <span>{{ listing()!.vehicleModelName }}</span>
              </div>
            }
            @if (listing()!.yearFrom || listing()!.yearTo) {
              <div class="meta-item">
                <span class="meta-label">{{ 'listing.compatible_with' | translate }}</span>
                <span>{{ listing()!.yearFrom }} – {{ listing()!.yearTo }}</span>
              </div>
            }
            @if (listing()!.oemReference) {
              <div class="meta-item">
                <span class="meta-label">{{ 'listing.oem_ref' | translate }}</span>
                <span class="oem-ref">{{ listing()!.oemReference }}</span>
              </div>
            }
            <div class="meta-item">
              <span class="meta-label">📍 {{ 'listing.location' | translate }}</span>
              <span>{{ listing()!.city }}, {{ listing()!.country }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">📅 {{ 'listing.posted' | translate }}</span>
              <span>{{ listing()!.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>

          <!-- Seller contact -->
          <div class="contact-box">
            <p class="seller-name">👤 {{ listing()!.sellerName }}</p>

            @if (phoneRevealed()) {
              <a [href]="'tel:' + listing()!.phoneNumber" class="btn btn-primary phone-btn">
                📞 {{ listing()!.phoneNumber }}
              </a>
            } @else {
              <button class="btn btn-primary phone-btn" (click)="revealPhone()">
                📞 {{ 'listing.show_phone' | translate }}
              </button>
            }

            @if (auth.isLoggedIn() && auth.user()?.userId !== listing()!.sellerId) {
              <button class="btn btn-secondary" (click)="showMessageForm.set(!showMessageForm())">
                ✉️ {{ 'listing.send_message' | translate }}
              </button>

              @if (showMessageForm()) {
                <div class="message-form">
                  <textarea class="form-control" [(ngModel)]="messageText" rows="3"
                    [placeholder]="'messages.type_message' | translate"></textarea>
                  <button class="btn btn-primary btn-sm" (click)="sendMessage()" [disabled]="!messageText.trim()">
                    {{ 'messages.send' | translate }}
                  </button>
                  @if (messageSent()) {
                    <div class="alert alert-success">✓ Message envoyé</div>
                  }
                </div>
              }
            }

            @if (auth.isLoggedIn()) {
              <button class="btn btn-secondary fav-btn" (click)="toggleFavorite()">
                {{ listing()!.isFavorite ? '❤️' : '🤍' }}
                {{ (listing()!.isFavorite ? 'listing.remove_favorite' : 'listing.add_favorite') | translate }}
              </button>
            }
          </div>
        </div>

        <!-- Description -->
        <div class="description-section">
          <h2>{{ 'listing.description' | translate }}</h2>
          <p>{{ lang.currentLang() === 'ar' ? listing()!.descriptionAr : listing()!.descriptionFr }}</p>
        </div>

      </div>
    }
  `,
  styles: [`
    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      grid-template-rows: auto auto;
      gap: 1.5rem;
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
    .gallery { grid-column: 1; grid-row: 1; }
    .info-panel { grid-column: 2; grid-row: 1; }
    .description-section { grid-column: 1 / -1; }

    .main-photo {
      width: 100%;
      height: 400px;
      border-radius: var(--radius);
      overflow: hidden;
      background: #eee;
    }
    .main-photo img { width: 100%; height: 100%; object-fit: cover; }
    .no-photo {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      color: #ccc;
    }
    .thumbnails {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
    .thumbnails img {
      width: 70px;
      height: 70px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    }
    .thumbnails img.active { border-color: var(--primary); }

    .info-panel {
      background: #fff;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 1.5rem;
      height: fit-content;
      position: sticky;
      top: 80px;
    }
    .info-header { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
    .info-panel h1 { font-size: 1.3rem; margin-bottom: 0.75rem; }
    .price { font-size: 1.8rem; font-weight: 700; color: var(--primary); margin-bottom: 1rem; }

    .meta-grid { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .meta-label { color: var(--text-light); }
    .oem-ref { font-family: monospace; background: #f5f5f5; padding: 0.1rem 0.4rem; border-radius: 4px; }

    .contact-box {
      border-top: 1px solid var(--border);
      padding-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .seller-name { font-weight: 600; }
    .phone-btn { width: 100%; }
    .fav-btn { width: 100%; }
    .message-form { display: flex; flex-direction: column; gap: 0.5rem; }

    .description-section {
      background: #fff;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 1.5rem;
    }
    .description-section h2 { margin-bottom: 1rem; }
    .description-section p { line-height: 1.8; white-space: pre-wrap; }

    @media (max-width: 768px) {
      .detail-layout { grid-template-columns: 1fr; }
      .info-panel { position: static; }
      .main-photo { height: 260px; }
    }
  `]
})
export class ListingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private listingService = inject(ListingService);
  private messageService = inject(MessageService);
  auth = inject(AuthService);
  lang = inject(LangService);

  listing = signal<Listing | null>(null);
  loading = signal(true);
  activePhoto = signal(0);
  phoneRevealed = signal(false);
  showMessageForm = signal(false);
  messageSent = signal(false);
  messageText = '';

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.listingService.getById(id).subscribe({
      next: l => { this.listing.set(l); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  revealPhone() { this.phoneRevealed.set(true); }

  toggleFavorite() {
    const l = this.listing();
    if (!l) return;
    this.listingService.toggleFavorite(l.id).subscribe(res => {
      this.listing.set({ ...l, isFavorite: res.isFavorite });
    });
  }

  sendMessage() {
    const l = this.listing();
    if (!l || !this.messageText.trim()) return;
    this.messageService.send(l.id, l.sellerId, this.messageText).subscribe(() => {
      this.messageSent.set(true);
      this.messageText = '';
      setTimeout(() => this.messageSent.set(false), 3000);
    });
  }
}
