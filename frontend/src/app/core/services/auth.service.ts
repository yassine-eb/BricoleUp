import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginPayload, RegisterPayload } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_KEY = 'bricoleup_access';
  private readonly REFRESH_KEY = 'bricoleup_refresh';

  private _currentUser = signal<User | null>(this.loadUser());
  private _loading = signal(false);

  readonly currentUser$ = this._currentUser.asReadonly();
  readonly isAuthenticated$ = computed(() => this._currentUser() !== null);
  readonly isClient$ = computed(() => this._currentUser()?.role === 'client');
  readonly isPrestataire$ = computed(() => this._currentUser()?.role === 'prestataire');

  constructor(private http: HttpClient, private router: Router) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    this._loading.set(true);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login/`, payload).pipe(
      tap(res => this.handleAuth(res)),
      catchError(err => { this._loading.set(false); return throwError(() => err); }),
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    this._loading.set(true);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register/`, payload).pipe(
      tap(res => this.handleAuth(res)),
      catchError(err => { this._loading.set(false); return throwError(() => err); }),
    );
  }

  logout(): Observable<unknown> {
    const refresh = this.getRefreshToken();
    return this.http.post(`${environment.apiUrl}/auth/logout/`, { refresh }).pipe(
      tap(() => this.clearAuth()),
      catchError(() => { this.clearAuth(); return throwError(() => null); }),
    );
  }

  refreshToken(): Observable<{ access: string }> {
    const refresh = this.getRefreshToken();
    return this.http.post<{ access: string }>(`${environment.apiUrl}/auth/token/refresh/`, { refresh }).pipe(
      tap(res => localStorage.setItem(this.ACCESS_KEY, res.access)),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  setTokens(access: string, refresh: string, user?: User): void {
    localStorage.setItem(this.ACCESS_KEY, access);
    if (refresh) localStorage.setItem(this.REFRESH_KEY, refresh);
    if (user) { localStorage.setItem('bricoleup_user', JSON.stringify(user)); this._currentUser.set(user); }
    localStorage.removeItem('bu_liked_cards');
  }

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
    localStorage.setItem('bricoleup_user', JSON.stringify(user));
  }

  private handleAuth(res: AuthResponse): void {
    localStorage.setItem(this.ACCESS_KEY, res.access);
    localStorage.setItem(this.REFRESH_KEY, res.refresh);
    localStorage.setItem('bricoleup_user', JSON.stringify(res.user));
    this._currentUser.set(res.user);
    this._loading.set(false);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem('bricoleup_user');
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem('bricoleup_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
