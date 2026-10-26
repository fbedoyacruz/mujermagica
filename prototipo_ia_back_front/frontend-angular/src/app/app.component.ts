import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" *ngIf="!isLoginRoute(); else loginShell">
      <aside>
        <h1>RaaS</h1>
        <p>Prototipo IA</p>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/products" routerLinkActive="active">Productos</a>
          <a routerLink="/providers" routerLinkActive="active">Proveedores</a>
          <a routerLink="/customers" routerLinkActive="active">Clientes</a>
        </nav>
        <small>Usuario: {{ auth.username() }}</small>
        <button (click)="logout()">Salir</button>
      </aside>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>

    <ng-template #loginShell>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [
    `:host{display:block;min-height:100vh;background:#f8fafc;color:#0f172a;font-family:Segoe UI,Arial,sans-serif;}`,
    `.layout{display:grid;grid-template-columns:240px 1fr;min-height:100vh;}`,
    `aside{padding:18px;background:#0f172a;color:#fff;display:flex;flex-direction:column;gap:10px;}`,
    `h1{margin:0;font-size:26px;} p{margin:0;color:#94a3b8;}`,
    `nav{display:flex;flex-direction:column;gap:6px;margin:10px 0;}`,
    `a{padding:8px 10px;border-radius:8px;color:#e2e8f0;text-decoration:none;} a.active,a:hover{background:#1e293b;}`,
    `button{margin-top:auto;padding:9px 10px;border-radius:8px;border:0;background:#ef4444;color:#fff;font-weight:700;cursor:pointer;}`,
    `main{padding:18px;}`,
    `@media (max-width: 900px){.layout{grid-template-columns:1fr;} aside{position:sticky;top:0;z-index:2;}}`
  ]
})
export class AppComponent {
  constructor(public readonly auth: AuthService, private readonly router: Router) {}

  isLoginRoute(): boolean {
    return this.router.url.startsWith('/login');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
