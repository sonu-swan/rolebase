import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecordsResponse, User } from './models';

const p = (delay: number) => new HttpParams().set('delay', String(delay || 0)); // delay = fake API slowness in ms

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}
  getProfile(delay = 0): Observable<User> { return this.http.get<User>('/api/me', { params: p(delay) }); }
  getRecords(delay = 0): Observable<RecordsResponse> { return this.http.get<RecordsResponse>('/api/records', { params: p(delay) }); }
  // Admin only
  list(delay = 0): Observable<User[]> { return this.http.get<User[]>('/api/users', { params: p(delay) }); }
  create(u: any, delay = 0) { return this.http.post('/api/users', u, { params: p(delay) }); }
  update(id: string, u: any, delay = 0) { return this.http.put(`/api/users/${id}`, u, { params: p(delay) }); }
  remove(id: string, delay = 0) { return this.http.delete(`/api/users/${id}`, { params: p(delay) }); }
}
