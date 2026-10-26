import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PageResponse, Provider } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProvidersService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/providers';

  constructor(private readonly http: HttpClient) {}

  list(search = '', page = 0, size = 20) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PageResponse<Provider>>(this.apiUrl, { params });
  }

  create(payload: Provider) {
    return this.http.post<Provider>(this.apiUrl, payload);
  }

  update(id: number, payload: Provider) {
    return this.http.put<Provider>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
