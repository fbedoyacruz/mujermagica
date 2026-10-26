import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PageResponse, Product } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/products';

  constructor(private readonly http: HttpClient) {}

  list(search = '', page = 0, size = 20) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PageResponse<Product>>(this.apiUrl, { params });
  }

  create(payload: Product) {
    return this.http.post<Product>(this.apiUrl, payload);
  }

  update(id: number, payload: Product) {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
