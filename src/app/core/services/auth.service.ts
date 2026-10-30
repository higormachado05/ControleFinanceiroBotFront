import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthUser,
  LinkTelegramAccountRequest,
  LoginRequest,
  LoginResponse,
  RegisterApiRequest,
} from '../models/auth.models';
import { UserPreferencesService } from './user-preferences.service';

const TOKEN_STORAGE_KEY = 'granaflow_access_token';
const USER_STORAGE_KEY = 'granaflow_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly userPreferences = inject(UserPreferencesService);
  private readonly authUrl = `${environment.apiUrl}/api/auth`;
  private readonly token = signal<string | null>(this.readStoredToken());
  private readonly currentUser = signal<AuthUser | null>(this.readStoredUser());
  private readonly loadingUser = signal(false);

  readonly isAuthenticated = computed(() => !!this.token());
  readonly user = computed(() => this.currentUser());
  readonly isLoadingUser = computed(() => this.loadingUser());

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.authUrl}/login`, credentials)
      .pipe(tap((response) => this.applySession(response.accessToken, response.user)));
  }

  register(data: RegisterApiRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.authUrl}/register`, data);
  }

  linkTelegramAccount(data: LinkTelegramAccountRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.authUrl}/link-telegram`, data)
      .pipe(tap((response) => this.applySession(response.accessToken, response.user)));
  }

  loadCurrentUser(): Observable<AuthUser | null> {
    if (!this.token()) {
      this.clearSession(false);
      return of(null);
    }

    this.loadingUser.set(true);

    return this.http.get<AuthUser>(`${this.authUrl}/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.userPreferences.setFromAuth(user.financialCycleStartDay);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }),
      catchError(() => {
        this.clearSession(true);
        return of(null);
      }),
      finalize(() => this.loadingUser.set(false)),
    );
  }

  initializeSession(): Observable<AuthUser | null> {
    if (!this.token()) {
      return of(null);
    }

    if (this.currentUser()) {
      return of(this.currentUser());
    }

    return this.loadCurrentUser();
  }

  logout(): void {
    this.clearSession(true);
  }

  getToken(): string | null {
    return this.token();
  }

  private applySession(accessToken: string, user: AuthUser): void {
    this.token.set(accessToken);
    this.currentUser.set(user);
    this.userPreferences.setFromAuth(user.financialCycleStartDay);
    sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private clearSession(clearToken: boolean): void {
    if (clearToken) {
      this.token.set(null);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    this.currentUser.set(null);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }

  private readStoredToken(): string | null {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private readStoredUser(): AuthUser | null {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const user = JSON.parse(raw) as AuthUser;
      this.userPreferences.setFromAuth(user.financialCycleStartDay);
      return user;
    } catch {
      return null;
    }
  }
}
