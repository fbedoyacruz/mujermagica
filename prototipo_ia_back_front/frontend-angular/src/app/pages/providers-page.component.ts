import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Provider } from '../models/api.models';
import { ProvidersService } from '../services/providers.service';

@Component({
  selector: 'app-providers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="card">
      <div class="toolbar">
        <h2>Proveedores</h2>
        <div>
          <input [(ngModel)]="search" placeholder="Buscar proveedor" (keyup.enter)="load()" />
          <button (click)="load()">Buscar</button>
          <button (click)="newItem()">Nuevo</button>
        </div>
      </div>

      <form class="form" *ngIf="showForm" [formGroup]="form" (ngSubmit)="save()">
        <input formControlName="name" placeholder="Nombre" />
        <input formControlName="contact" placeholder="Contacto" />
        <input formControlName="phone" placeholder="Telefono" />
        <input formControlName="email" placeholder="Correo" />
        <label><input type="checkbox" formControlName="active" /> Activo</label>
        <div class="actions"><button type="button" (click)="cancel()">Cancelar</button><button type="submit">Guardar</button></div>
      </form>

      <table>
        <thead><tr><th>Nombre</th><th>Contacto</th><th>Telefono</th><th>Correo</th><th>Activo</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let item of items">
            <td>{{ item.name }}</td><td>{{ item.contact }}</td><td>{{ item.phone }}</td><td>{{ item.email }}</td><td>{{ item.active ? 'Si' : 'No' }}</td>
            <td><button (click)="edit(item)">Editar</button><button (click)="remove(item)">Eliminar</button></td>
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
    `input,button{padding:8px;border-radius:8px;border:1px solid #cbd5e1;} button{cursor:pointer;}`,
    `table{width:100%;border-collapse:collapse;font-size:14px;} th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;}`,
    `.error{color:#b91c1c;font-weight:600;}`
  ]
})
export class ProvidersPageComponent implements OnInit {
  items: Provider[] = [];
  selectedId: number | null = null;
  showForm = false;
  error = '';
  search = '';

  form = this.fb.group({
    name: ['', Validators.required],
    contact: [''],
    phone: [''],
    email: [''],
    active: [true]
  });

  constructor(private readonly fb: FormBuilder, private readonly providersService: ProvidersService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.providersService.list(this.search).subscribe({
      next: (page) => {
        this.items = page.content;
        this.error = '';
      },
      error: () => (this.error = 'No se pudieron cargar proveedores.')
    });
  }

  newItem(): void {
    this.selectedId = null;
    this.showForm = true;
    this.form.reset({ name: '', contact: '', phone: '', email: '', active: true });
  }

  edit(item: Provider): void {
    this.selectedId = item.id || null;
    this.showForm = true;
    this.form.reset(item);
  }

  save(): void {
    if (this.form.invalid) return;
    const payload = this.form.getRawValue() as Provider;
    const request = this.selectedId
      ? this.providersService.update(this.selectedId, payload)
      : this.providersService.create(payload);

    request.subscribe({
      next: () => {
        this.cancel();
        this.load();
      },
      error: () => (this.error = 'No se pudo guardar el proveedor.')
    });
  }

  remove(item: Provider): void {
    if (!item.id) return;
    this.providersService.delete(item.id).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'No se pudo eliminar el proveedor.')
    });
  }

  cancel(): void {
    this.showForm = false;
    this.selectedId = null;
  }
}
