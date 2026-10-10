import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserService } from '../../core/user.service';
import { RecordsResponse, User } from '../../core/models';

@Component({
  standalone: false,
  template: `
  <main>
    <h1>Welcome back{{ profile ? ', ' + profile.name.split(' ')[0] : '' }}</h1>
    <p class="sub">Your details and the records your role can open.</p>

    <div class="grid2">
      <section class="card">
        <h3>Your details</h3>
        <div class="bar" [class.on]="profileLoading"></div>
        <ng-container *ngIf="profile as p">
          <div class="profile"><div class="avatar big">{{ p.name.charAt(0) }}</div><div><strong>{{ p.name }}</strong><div class="muted">{{ p.role }}</div></div></div>
          <dl><dt>User ID</dt><dd>{{ p.id }}</dd><dt>Email</dt><dd>{{ p.email || '-' }}</dd><dt>Joined</dt><dd>{{ p.createdAt | date:'mediumDate' }}</dd></dl>
        </ng-container>
      </section>

      <section class="card">
        <h3>Slow API demo</h3>
        <div class="bar" [class.on]="profileLoading || recordsLoading"></div>
        <label class="muted">Server delay (ms)</label><br>
        <input class="inp" type="number" [(ngModel)]="delay" min="0" max="10000" step="500">
        <button class="btn" (click)="load()" [disabled]="profileLoading || recordsLoading">Reload both</button>
        <p class="stat">Profile call: <b>{{ profileMs === null ? 'waiting...' : profileMs + ' ms' }}</b></p>
        <p class="stat">Records call: <b>{{ recordsMs === null ? 'waiting...' : recordsMs + ' ms' }}</b> (1.5x delay)</p>
        <p class="muted">Both calls start together and finish on their own.</p>
      </section>
    </div>

    <section class="card">
      <h3>Your records</h3>
      <div class="bar" [class.on]="recordsLoading"></div>
      <ng-container *ngIf="records as r">
        <p>Access: <span *ngFor="let l of r.allowedLevels" [class]="'tag lvl-' + l">{{ l }}</span>
          <span class="muted" *ngIf="r.hidden">{{ r.hidden }} record(s) hidden by your access level</span></p>
        <div class="scroll"><table><tr><th>ID</th><th>Title</th><th>Owner</th><th>Access level</th></tr>
          <tr *ngFor="let x of r.records"><td>{{ x.id }}</td><td>{{ x.title }}</td><td>{{ x.owner }}</td><td><span [class]="'tag lvl-' + x.accessLevel">{{ x.accessLevel }}</span></td></tr></table></div>
      </ng-container>
    </section>
  </main>`,
})
export class DashboardComponent implements OnInit {
  delay = 2000;
  profile: User | null = null; records: RecordsResponse | null = null;
  profileLoading = false; recordsLoading = false;
  profileMs: number | null = null; recordsMs: number | null = null;
  constructor(private users: UserService) {}
  ngOnInit() { this.load(); }

  load() {
    this.profile = null; this.records = null; this.profileMs = null; this.recordsMs = null;
    this.profileLoading = true; this.recordsLoading = true;
    const t0 = Date.now();
    this.users.getProfile(this.delay).pipe(finalize(() => { this.profileLoading = false; this.profileMs = Date.now() - t0; }))
      .subscribe(p => this.profile = p);
    this.users.getRecords(this.delay * 1.5).pipe(finalize(() => { this.recordsLoading = false; this.recordsMs = Date.now() - t0; }))
      .subscribe(r => this.records = r);
  }
}
@NgModule({ declarations: [DashboardComponent], imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: DashboardComponent }])] })
export class DashboardModule {}
