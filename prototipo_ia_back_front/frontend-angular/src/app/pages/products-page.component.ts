import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, Provider } from '../models/api.models';
import { ProductsService } from '../services/products.service';
import { ProvidersService } from '../services/providers.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <div class="toolbar">
        <h2>Productos</h2>
        <div>
          <input [(ngModel)]="search" placeholder="Buscar producto, SKU o marca" (keyup.enter)="load()" />
          <button (click)="load()">Buscar</button>
          <button (click)="newItem()">Nuevo</button>
        </div>
      </div>

      <form class="form" *ngIf="showForm" [formGroup]="form" (ngSubmit)="save()">
        <input formControlName="name" placeholder="Nombre" />
        <input formControlName="sku" placeholder="SKU" />
        <input formControlName="brand" placeholder="Marca" />
        <input type="number" formControlName="priceBuy" placeholder="Precio compra" />
        <input type="number" formControlName="priceSell" placeholder="Precio venta" />
        <select formControlName="providerId">
          <option [ngValue]="null">Sin proveedor</option>
          <option *ngFor="let p of providers" [ngValue]="p.id">{{ p.name }}</option>
        </select>
        <label><input type="checkbox" formControlName="active" /> Activo</label>
        <div class="actions">
          <button type="button" (click)="cancel()">Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>

      <table>
        <thead>
          <tr><th>Nombre</th><th>SKU</th><th>Marca</th><th>Compra</th><th>Venta</th><th>Proveedor</th><th>Activo</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of items">
            <td>{{ item.name }}</td>
            <td>{{ item.sku }}</td>
            <td>{{ item.brand }}</td>
            <td>{{ item.priceBuy | number }}</td>
            <td>{{ item.priceSell | number }}</td>
            <td>{{ item.providerName || '-' }}</td>
            <td>{{ item.active ? 'Si' : 'No' }}</td>
            <td>
              <button (click)="edit(item)">Editar</button>
              <button (click)="remove(item)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="error" *ngIf="error">{{ error }}</p>
    </section>
  `,
  styles: [
    `.card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;}`,
    `.toolbar{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;}`,
    `.toolbar div{display:flex;gap:8px;flex-wrap:wrap;}`,
    `.form{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:12px;}`,
    `.actions{grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end;}`,
    `input,select,button{padding:8px;border-radius:8px;border:1px solid #cbd5e1;} button{cursor:pointer;}`,
    `table{width:100%;border-collapse:collapse;font-size:14px;} th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;}`,
    `.error{color:#b91c1c;font-weight:600;}`
  ]
})
export class ProductsPageComponent implements OnInit {
  items: Product[] = [];
  providers: Provider[] = [];
  selectedId: number | null = null;
  showForm = false;
  error = '';
  search = '';

  form = this.fb.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    brand: ['', Validators.required],
    priceBuy: [0, Validators.required],
    priceSell: [0, Validators.required],
    providerId: [null as number | null],
    active: [true]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly productsService: ProductsService,
    private readonly providersService: ProvidersService
  ) {}

  ngOnInit(): void {
    this.load();
    this.providersService.list('', 0, 100).subscribe((page) => (this.providers = page.content));
  }

  load(): void {
    this.productsService.list(this.search).subscribe({
      next: (page) => {
        this.items = page.content;
        this.error = '';
      },
      error: () => (this.error = 'No se pudieron cargar productos.')
    });
  }

  newItem(): void {
    this.selectedId = null;
    this.showForm = true;
    this.form.reset({ name: '', sku: '', brand: '', priceBuy: 0, priceSell: 0, providerId: null, active: true });
  }

  edit(item: Product): void {
    this.selectedId = item.id || null;
    this.showForm = true;
    this.form.reset({
      name: item.name,
      sku: item.sku,
      brand: item.brand,
      priceBuy: item.priceBuy,
      priceSell: item.priceSell,
      providerId: item.providerId ?? null,
      active: item.active
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const payload = this.form.getRawValue() as Product;
    const request = this.selectedId
      ? this.productsService.update(this.selectedId, payload)
      : this.productsService.create(payload);

    request.subscribe({
      next: () => {
        this.cancel();
        this.load();
      },
      error: () => (this.error = 'No se pudo guardar el producto.')
    });
  }

  remove(item: Product): void {
    if (!item.id) return;
    this.productsService.delete(item.id).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'No se pudo eliminar el producto.')
    });
  }

  cancel(): void {
    this.showForm = false;
    this.selectedId = null;
  }
}
