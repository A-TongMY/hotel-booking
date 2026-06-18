import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser, LoginRequest, SignupRequest } from '../models';

const TOKEN_KEY = 'hb_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  // ── Reactive state ────────────────────────────────────────────────────────
  private readonly _user  = signal<AuthUser | null>(this.loadUserFromStorage());
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user       = this._user.asReadonly();
  readonly token      = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isStaff    = computed(() => {
    const role = this._user()?.role?.toLowerCase() ?? '';
    return role === 'staff' || role === 'admin';
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(req: LoginRequest): Promise<{ error: string | null }> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${environment.apiBaseUrl}/Auth/login`, req)
      );

      // API may return { token } or just the token string
      const token: string = typeof res === 'string' ? res : (res.token ?? res.accessToken ?? '');
      if (!token) return { error: 'No token received from server.' };

      this.setSession(token);
      return { error: null };
    } catch (err: any) {
      return { error: err?.error?.message ?? err?.error ?? 'Login failed. Check credentials.' };
    }
  }

  // ── Signup ────────────────────────────────────────────────────────────────
  async signup(req: SignupRequest): Promise<{ error: string | null }> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${environment.apiBaseUrl}/Auth/signup`, req)
      );
      return { error: null };
    } catch (err: any) {
      const msg = err?.error?.message
        ?? (typeof err?.error === 'string' ? err.error : null)
        ?? 'Signup failed. Please try again.';
      return { error: msg };
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  // ── Token helpers ─────────────────────────────────────────────────────────
  getToken(): string | null {
    return this._token();
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private setSession(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
    this._user.set(this.decodeUser(token));
  }

  private loadUserFromStorage(): AuthUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      return this.decodeUser(token);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }

  private decodeUser(token: string): AuthUser {
    const payload = token.split('.')[1];
    // Fix base64url padding
    const padded  = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json     = decodeURIComponent(
      atob(padded).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    const p = JSON.parse(json);

    // Handle both short-form and .NET long-form claim names
    const role = p['role']
      ?? p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      ?? 'guest';

    const username = p['unique_name']
      ?? p['name']
      ?? p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
      ?? p['sub']
      ?? 'unknown';

    const email = p['email']
      ?? p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
      ?? '';

    const id = p['sub'] ?? p['nameid']
      ?? p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      ?? '';

    return { id, username, email, role };
  }
}
