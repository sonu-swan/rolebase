import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { tap } from "rxjs/operators";
import { Role, User } from "./models";

@Injectable({ providedIn: "root" })
export class AuthService {
  private _user$ = new BehaviorSubject<User | null>(null);
  user$ = this._user$.asObservable();
  constructor(private http: HttpClient) {}

  get token() { return sessionStorage.getItem("token"); }
  get user() { return this._user$.value; }
  get isAdmin() { return this.user?.role === "Admin"; }

  login(userId: string, password: string, role: Role) {
    return this.http.post<{ token: string; user: User }>("/api/login", { userId, password, role }).pipe(
      tap(r => { sessionStorage.setItem("token", r.token); this._user$.next(r.user); }));
  }
  logout() { sessionStorage.removeItem("token"); this._user$.next(null); }

  // Runs once at app start: restores the session after a page refresh.
  async restoreSession(): Promise<void> {
    if (!this.token) return;
    try { this._user$.next(await firstValueFrom(this.http.get<User>("/api/me"))); }
    catch { this.logout(); }
  }
}
