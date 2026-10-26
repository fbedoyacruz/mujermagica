export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export interface Provider {
  id?: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface Customer {
  id?: number;
  name: string;
  document: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface Product {
  id?: number;
  name: string;
  sku: string;
  brand: string;
  priceBuy: number;
  priceSell: number;
  providerId?: number | null;
  providerName?: string | null;
  active: boolean;
}
