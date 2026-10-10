import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { adminGuard, CoreModule, loggedInGuard } from './core/core.module';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', canActivate: [loggedInGuard], loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'admin', canActivate: [loggedInGuard, adminGuard], loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) },
  { path: '', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  { path: '**', redirectTo: 'dashboard' },
];
@NgModule({ imports: [BrowserModule, AppComponent, CoreModule, RouterModule.forRoot(routes)], bootstrap: [AppComponent] })
export class AppModule {}
