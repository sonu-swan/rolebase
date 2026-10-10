import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../core/auth.service';
import { User } from '../../core/models';

@Component({
  standalone: false,
  template: `
  <main>
    <h1>Manage users</h1>
    <p class="sub">Add people, change roles, remove access.</p>

    <section class="card">
      <h3>Add user</h3>
      <input class="inp" [(ngModel)]="form.id" placeholder="User ID"><input class="inp" [(ngModel)]="form.name" placeholder="Name">
      <input class="inp" [(ngModel)]="form.email" placeholder="Email"><input class="inp" [(ngModel)]="form.password" type="password" placeholder="Password">
      <select class="inp" [(ngModel)]="form.role"><option>General User</option><option>Admin</option></select>
      <button class="btn" (click)="add()" [disabled]="busy">Add user</button>
      <p class="err" *ngIf="error">{{ error }}</p>
    </section>

    <section class="card">
      <h3>Users ({{ list.length }})</h3>
      <div class="bar" [class.on]="busy"></div>
      <span class="muted">API delay (ms)</span> <input class="inp" type="number" [(ngModel)]="delay" min="0" max="10000" step="500">
      <button class="btn ghost" (click)="load()" [disabled]="busy">Reload</button>
      <div class="scroll"><table><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
        <tr *ngFor="let u of list"><td>{{ u.id }}</td><td>{{ u.name }}</td><td>{{ u.email || '-' }}</td>
          <td><select class="inp" [ngModel]="u.role" (ngModelChange)="changeRole(u, $event)" [disabled]="busy"><option>General User</option><option>Admin</option></select></td>
          <td><button class="btn danger" (click)="remove(u)" [disabled]="busy || u.id === me?.id">Delete</button></td></tr></table></div>
    </section>
  </main>`,
})
export class AdminComponent implements OnInit {
  list: User[] = []; delay = 1000; busy = false; error = '';
  form = { id: '', name: '', email: '', password: '', role: 'General User' };
  me: User | null;
  constructor(private users: UserService, auth: AuthService) { this.me = auth.user; }
  ngOnInit() { this.load(); }
  private run(obs: any, done: (r?: any) => void) {
    this.busy = true; this.error = '';
    obs.subscribe({ next: (r: any) => done(r), error: (e: any) => { this.busy = false; this.error = e.error?.message || 'Request failed.'; } });
  }
  load() { this.run(this.users.list(this.delay), (r: User[]) => { this.list = r; this.busy = false; }); }
  add() { this.run(this.users.create(this.form, this.delay), () => { this.form = { id: '', name: '', email: '', password: '', role: 'General User' }; this.load(); }); }
  changeRole(u: User, role: string) { this.run(this.users.update(u.id, { role }, this.delay), () => this.load()); }
  remove(u: User) { if (confirm(`Delete ${u.id}?`)) this.run(this.users.remove(u.id, this.delay), () => this.load()); }
}
@NgModule({ declarations: [AdminComponent], imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: AdminComponent }])] })
export class AdminModule {}
