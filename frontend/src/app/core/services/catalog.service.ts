import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Brand, Category, VehicleModel, AdminStats } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog`;

  getCategories() {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  getBrands(withModels = false) {
    return this.http.get<Brand[]>(`${this.base}/brands`, {
      params: withModels ? { withModels: 'true' } : {}
    });
  }

  getModels(brandId: number) {
    return this.http.get<VehicleModel[]>(`${this.base}/brands/${brandId}/models`);
  }

  getStats() {
    return this.http.get<AdminStats>(`${this.base}/admin/stats`);
  }

  getUsers(page = 1, pageSize = 20) {
    return this.http.get<any>(`${this.base}/admin/users`, {
      params: { page, pageSize }
    });
  }

  toggleUser(id: string) {
    return this.http.patch<{ isActive: boolean }>(`${this.base}/admin/users/${id}/toggle`, {});
  }

  createCategory(data: any) {
    return this.http.post<Category>(`${this.base}/categories`, data);
  }

  updateCategory(id: number, data: any) {
    return this.http.put<Category>(`${this.base}/categories/${id}`, data);
  }

  createBrand(data: any) {
    return this.http.post<Brand>(`${this.base}/brands`, data);
  }

  updateBrand(id: number, data: any) {
    return this.http.put<Brand>(`${this.base}/brands/${id}`, data);
  }

  createModel(brandId: number, data: any) {
    return this.http.post<VehicleModel>(`${this.base}/brands/${brandId}/models`, data);
  }

  updateModel(id: number, data: any) {
    return this.http.put<VehicleModel>(`${this.base}/models/${id}`, data);
  }
}
