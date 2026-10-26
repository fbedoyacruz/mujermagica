import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card">
      <h2>Dashboard inicial</h2>
      <p>Este sprint deja autenticación y maestros operativos.</p>
      <ul>
        <li>Productos: CRUD + búsqueda</li>
        <li>Proveedores: CRUD + búsqueda</li>
        <li>Clientes: CRUD + búsqueda</li>
      </ul>
    </section>
  `,
  styles: [
    `.card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;}`,
    `h2{margin:0 0 8px;} p{margin:0 0 8px;color:#64748b;}`,
    `ul{margin:0;padding-left:20px;}`
  ]
})
export class DashboardPageComponent {}
