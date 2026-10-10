import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from './core/auth.service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  template: `
  <header class="topbar" *ngIf="auth.user$ | async as u">
    <span class="brand">role<i>base</i></span>
    <nav>
      <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
      <a routerLink="/admin" routerLinkActive="active" *ngIf="u.role === 'Admin'">Manage users</a>
    </nav>
    <span class="sp"></span>
    <div class="who"><div class="avatar">{{ u.name.charAt(0) }}</div><span>{{ u.name }}<small>{{ u.role }}</small></span></div>
    <button class="btn ghost" (click)="logout()">Log out</button>
  </header>
  <router-outlet></router-outlet>`,
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}
  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}
