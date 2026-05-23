import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Listing, ListingSearchParams, PagedResult } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ListingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/listings`;

  search(params: ListingSearchParams) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<PagedResult<Listing>>(this.base, { params: p });
  }

  getById(id: number) {
    return this.http.get<Listing>(`${this.base}/${id}`);
  }

  create(data: any) {
    return this.http.post<Listing>(this.base, data);
  }

  update(id: number, data: any) {
    return this.http.put<Listing>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }

  uploadPhotos(id: number, files: File[]) {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return this.http.post<any[]>(`${this.base}/${id}/photos`, form);
  }

  deletePhoto(listingId: number, photoId: number) {
    return this.http.delete(`${this.base}/${listingId}/photos/${photoId}`);
  }

  validate(id: number, approve: boolean, rejectionReason?: string) {
    return this.http.post<Listing>(`${this.base}/${id}/validate`, { approve, rejectionReason });
  }

  adminGetAll(page = 1, pageSize = 20, status?: string) {
    let p = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) p = p.set('status', status);
    return this.http.get<PagedResult<Listing>>(`${this.base}/admin/all`, { params: p });
  }

  myListings(page = 1, pageSize = 20) {
    return this.http.get<PagedResult<Listing>>(`${this.base}/my`, {
      params: new HttpParams().set('page', page).set('pageSize', pageSize)
    });
  }

  toggleFavorite(id: number) {
    return this.http.post<{ isFavorite: boolean }>(`${this.base}/${id}/favorite`, {});
  }

  getFavorites(page = 1, pageSize = 20) {
    return this.http.get<PagedResult<Listing>>(`${this.base}/favorites`, {
      params: new HttpParams().set('page', page).set('pageSize', pageSize)
    });
  }
}
