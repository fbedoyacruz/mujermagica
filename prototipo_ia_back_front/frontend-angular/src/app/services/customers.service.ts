import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Customer, PageResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/customers';

  constructor(private readonly http: HttpClient) {}

  list(search = '', page = 0, size = 20) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PageResponse<Customer>>(this.apiUrl, { params });
  }

  create(payload: Customer) {
    return this.http.post<Customer>(this.apiUrl, payload);
  }

  update(id: number, payload: Customer) {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
