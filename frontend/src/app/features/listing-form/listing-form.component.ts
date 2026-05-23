import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ListingService } from '../../core/services/listing.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LangService } from '../../core/services/lang.service';
import { Category, Brand, VehicleModel, Listing } from '../../core/models';

@Component({
  selector: 'app-listing-form',
  standalone: true,
  imports: [FormsModule, TranslateModule, CommonModule, RouterLink],
  template: `
    <div class="container form-page">
      <h1>{{ (isEdit ? 'listing.edit_title' : 'listing.create_title') | translate }}</h1>
      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (success()) { <div class="alert alert-success">{{ success() }}</div> }

      <form class="listing-form" (ngSubmit)="submit()">
        <div class="form-section">
          <h3>📝 Informations</h3>
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'listing.title_ar' | translate }} *</label>
              <input class="form-control" [(ngModel)]="form.titleAr" name="titleAr" required dir="rtl" />
            </div>
            <div class="form-group">
              <label>{{ 'listing.title_fr' | translate }} *</label>
              <input class="form-control" [(ngModel)]="form.titleFr" name="titleFr" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'listing.desc_ar' | translate }}</label>
              <textarea class="form-control" [(ngModel)]="form.descriptionAr" name="descAr" rows="4" dir="rtl"></textarea>
            </div>
            <div class="form-group">
              <label>{{ 'listing.desc_fr' | translate }}</label>
              <textarea class="form-control" [(ngModel)]="form.descriptionFr" name="descFr" rows="4"></textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>🔩 Pièce</h3>
          <div class="form-row-3">
            <div class="form-group">
              <label>{{ 'listing.category' | translate }} *</label>
              <select class="form-control" [(ngModel)]="form.categoryId" name="categoryId" required>
                <option [ngValue]="null">—</option>
                @for (c of categories(); track c.id) {
                  <option [ngValue]="c.id">{{ lang.currentLang() === 'ar' ? c.nameAr : c.nameFr }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'listing.condition' | translate }} *</label>
              <select class="form-control" [(ngModel)]="form.condition" name="condition" required>
                <option value="New">{{ 'listing.new' | translate }}</option>
                <option value="Used">{{ 'listing.used' | translate }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'listing.oem_ref' | translate }}</label>
              <input class="form-control" [(ngModel)]="form.oemReference" name="oem" />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>🚗 Véhicule compatible</h3>
          <div class="form-row-3">
            <div class="form-group">
              <label>{{ 'home.brand' | translate }}</label>
              <select class="form-control" [(ngModel)]="form.brandId" name="brandId" (change)="onBrandChange()">
                <option [ngValue]="null">—</option>
                @for (b of brands(); track b.id) { <option [ngValue]="b.id">{{ b.name }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'home.model' | translate }}</label>
              <select class="form-control" [(ngModel)]="form.vehicleModelId" name="modelId" [disabled]="!form.brandId">
                <option [ngValue]="null">—</option>
                @for (m of models(); track m.id) { <option [ngValue]="m.id">{{ m.name }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'listing.year_from' | translate }}</label>
              <input class="form-control" type="number" [(ngModel)]="form.yearFrom" name="yearFrom" min="1980" [max]="currentYear" />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>💰 Prix & Localisation</h3>
          <div class="form-row-3">
            <div class="form-group">
              <label>{{ 'listing.price' | translate }} *</label>
              <input class="form-control" type="number" [(ngModel)]="form.price" name="price" required min="0" />
            </div>
            <div class="form-group">
              <label>{{ 'listing.currency' | translate }}</label>
              <select class="form-control" [(ngModel)]="form.currency" name="currency">
                <option value="DZD">DZD</option>
                <option value="MAD">MAD</option>
                <option value="TND">TND</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'listing.country' | translate }}</label>
              <select class="form-control" [(ngModel)]="form.country" name="country">
                <option value="DZ">🇩🇿 Algérie</option>
                <option value="MA">🇲🇦 Maroc</option>
                <option value="TN">🇹🇳 Tunisie</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'listing.city' | translate }} *</label>
              <input class="form-control" [(ngModel)]="form.city" name="city" required />
            </div>
            <div class="form-group">
              <label>{{ 'listing.phone' | translate }} *</label>
              <input class="form-control" [(ngModel)]="form.phoneNumber" name="phone" required />
            </div>
          </div>
        </div>

        @if (!isEdit) {
          <div class="form-section">
            <h3>📷 {{ 'listing.upload_photos' | translate }}</h3>
            <input type="file" multiple accept="image/*" (change)="onFilesSelected($event)" class="file-input" />
            @if (selectedFiles().length > 0) {
              <div class="photo-previews">
                @for (preview of photoPreviews(); track $index) {
                  <img [src]="preview" class="photo-preview" />
                }
              </div>
            }
          </div>
        }

        <div class="form-actions">
          <a routerLink="/dashboard" class="btn btn-secondary">{{ 'common.cancel' | translate }}</a>
          <button class="btn btn-primary" type="submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner" style="width:16px;height:16px;border-width:2px"></span> }
            {{ (isEdit ? 'listing.update' : 'listing.submit') | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-page { padding: 2rem 1rem; max-width: 900px; }
    .form-page h1 { margin-bottom: 1.5rem; }
    .listing-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-section { background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); padding: 1.5rem; }
    .form-section h3 { margin-bottom: 1rem; font-size: 1rem; color: var(--text-light); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; }
    .file-input { width: 100%; padding: 0.5rem; border: 2px dashed var(--border); border-radius: var(--radius); cursor: pointer; }
    .photo-previews { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
    .photo-preview { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; }
    @media(max-width:600px) { .form-row, .form-row-3 { grid-template-columns: 1fr; } }
  `]
})
export class ListingFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private listingService = inject(ListingService);
  private catalogService = inject(CatalogService);
  lang = inject(LangService);

  isEdit = false;
  listingId: number | null = null;
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  models = signal<VehicleModel[]>([]);
  selectedFiles = signal<File[]>([]);
  photoPreviews = signal<string[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');
  currentYear = new Date().getFullYear();

  form: any = {
    titleAr: '', titleFr: '', descriptionAr: '', descriptionFr: '',
    price: null, currency: 'DZD', condition: 'Used',
    categoryId: null, brandId: null, vehicleModelId: null,
    yearFrom: null, yearTo: null, oemReference: '',
    country: 'DZ', city: '', phoneNumber: ''
  };

  ngOnInit() {
    this.catalogService.getCategories().subscribe(c => this.categories.set(c));
    this.catalogService.getBrands().subscribe(b => this.brands.set(b));

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.listingId = +id;
      this.listingService.getById(+id).subscribe(l => this.patchForm(l));
    }
  }

  onBrandChange() {
    this.form.vehicleModelId = null;
    this.models.set([]);
    if (this.form.brandId) {
      this.catalogService.getModels(this.form.brandId).subscribe(m => this.models.set(m));
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []).slice(0, 10);
    this.selectedFiles.set(files);
    const previews = files.map(f => URL.createObjectURL(f));
    this.photoPreviews.set(previews);
  }

  submit() {
    this.loading.set(true); this.error.set(''); this.success.set('');
    const obs = this.isEdit
      ? this.listingService.update(this.listingId!, this.form)
      : this.listingService.create(this.form);

    obs.subscribe({
      next: (listing) => {
        if (!this.isEdit && this.selectedFiles().length > 0) {
          this.listingService.uploadPhotos(listing.id, this.selectedFiles()).subscribe(() => {
            this.success.set('Annonce soumise pour validation !');
            setTimeout(() => this.router.navigate(['/dashboard']), 1500);
          });
        } else {
          this.success.set('Annonce mise à jour !');
          setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        }
        this.loading.set(false);
      },
      error: (e) => { this.error.set(e.error?.message || 'Erreur'); this.loading.set(false); }
    });
  }

  private patchForm(l: Listing) {
    this.form = {
      titleAr: l.titleAr, titleFr: l.titleFr,
      descriptionAr: l.descriptionAr, descriptionFr: l.descriptionFr,
      price: l.price, currency: l.currency, condition: l.condition,
      categoryId: l.categoryId, brandId: l.brandId, vehicleModelId: l.vehicleModelId,
      yearFrom: l.yearFrom, yearTo: l.yearTo, oemReference: l.oemReference,
      country: l.country, city: l.city, phoneNumber: l.phoneNumber
    };
    if (l.brandId) {
      this.catalogService.getModels(l.brandId).subscribe(m => this.models.set(m));
    }
  }
}
