import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { Role } from '../../core/models';

@Component({
  standalone: false,
  template: `<div class="stage"><div class="frame"><span class="dot a"></span><span class="dot b"></span><div class="auth">
    <div class="logo">role<i>base</i></div>
    <form class="auth-card" (ngSubmit)="submit()" #f="ngForm">
      <label class="field"><span>User ID</span><input name="uid" [(ngModel)]="userId" autocomplete="username" required></label>
      <label class="field"><span>Password</span><input name="pw" type="password" [(ngModel)]="password" autocomplete="current-password" required></label>
      <div class="seg" role="group" aria-label="Role">
        <button type="button" [class.on]="role === 'General User'" (click)="role = 'General User'">General User</button>
        <button type="button" [class.on]="role === 'Admin'" (click)="role = 'Admin'">Admin</button>
      </div>
      <button class="pill" [disabled]="f.invalid || loading">{{ loading ? 'Signing in...' : 'Log in' }}</button>
      <p class="err" *ngIf="error" style="text-align:center">{{ error }}</p>
    </form>
    <a class="alt" routerLink="/register">Create a new account</a></div></div></div>`,
})
export class LoginComponent {
  userId = ''; password = ''; role: Role = 'General User'; loading = false; error = '';
  constructor(private auth: AuthService, private router: Router) {}
  submit() {
    this.loading = true; this.error = '';
    this.auth.login(this.userId, this.password, this.role).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: e => { this.loading = false; this.error = e.error?.message || 'Cannot reach the server.'; },
    });
  }
}

@Component({
  standalone: false,
  template: `<div class="stage"><div class="frame"><span class="dot a"></span><span class="dot b"></span><div class="auth">
    <div class="logo">role<i>base</i></div>
    <form class="auth-card" (ngSubmit)="submit()" #f="ngForm">
      <label class="field"><span>User ID</span><input name="id" [(ngModel)]="m.id" required></label>
      <label class="field"><span>Full name</span><input name="name" [(ngModel)]="m.name" required></label>
      <label class="field"><span>Email address</span><input name="email" type="email" [(ngModel)]="m.email"></label>
      <label class="field"><span>Password (6+ characters)</span><input name="pw" type="password" [(ngModel)]="m.password" minlength="6" required></label>
      <button class="pill" [disabled]="f.invalid || loading">{{ loading ? 'Creating...' : 'Create account' }}</button>
      <p class="err" *ngIf="error" style="text-align:center">{{ error }}</p>
    </form>
    <a class="alt" routerLink="/login">Back to log in</a></div></div></div>`,
})
export class RegisterComponent {
  m = { id: '', name: '', email: '', password: '' }; loading = false; error = '';
  constructor(private http: HttpClient, private router: Router) {}
  submit() {
    this.loading = true; this.error = '';
    this.http.post('/api/register', this.m).subscribe({
      next: () => this.router.navigate(['/login']),
      error: e => { this.loading = false; this.error = e.error?.message || 'Cannot reach the server.'; },
    });
  }
}
@NgModule({ declarations: [LoginComponent, RegisterComponent], imports: [CommonModule, FormsModule, RouterModule.forChild([
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }])] })
export class AuthModule {}
