import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/auth';
  private readonly tokenKey = 'raas_proto_token';
  private readonly userKey = 'raas_proto_user';

  private readonly authState = new BehaviorSubject<boolean>(this.hasToken());
  readonly isAuthenticated$ = this.authState.asObservable();

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, response.username);
        this.authState.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.authState.next(false);
  }

  token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  username(): string {
    return localStorage.getItem(this.userKey) || 'usuario';
  }

  hasToken(): boolean {
    return !!this.token();
  }
}
