import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginPageComponent } from './pages/login-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { ProductsPageComponent } from './pages/products-page.component';
import { ProvidersPageComponent } from './pages/providers-page.component';
import { CustomersPageComponent } from './pages/customers-page.component';

export const appRoutes: Routes = [
  { path: 'login', component: LoginPageComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'products', component: ProductsPageComponent },
      { path: 'providers', component: ProvidersPageComponent },
      { path: 'customers', component: CustomersPageComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
