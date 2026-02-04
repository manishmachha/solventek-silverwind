import { computed, Injectable, signal } from '@angular/core';
import { User, AuthResponse } from '../models/auth.model';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  // State signal
  private state = signal<AuthState>(initialState);

  // Selectors (Computed)
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly accessToken = computed(() => this.state().accessToken);
  readonly userRole = computed(() => {
    return this.state().user?.role?.name || null;
  });
  readonly organizationId = computed(() => this.state().user?.orgId);
  readonly orgType = computed(() => this.state().user?.orgType);
  readonly organizationName = computed(() => this.state().user?.organization?.name);

  readonly permissions = computed(() => {
    return [];
  });

  hasPermission(code: string): boolean {
    if (this.userRole() === 'SUPER_ADMIN') return true;
    return false;
  }

  // Role Helper Methods
  isSuperAdmin(): boolean {
    return this.userRole() === 'SUPER_ADMIN';
  }

  isHRAdmin(): boolean {
    return this.userRole() === 'HR_ADMIN';
  }

  isTA(): boolean {
    return this.userRole() === 'TA';
  }

  isEmployee(): boolean {
    return this.userRole() === 'EMPLOYEE';
  }

  isVendor(): boolean {
    return this.userRole() === 'VENDOR';
  }

  isAdmin(): boolean {
    return this.isSuperAdmin() || this.isHRAdmin();
  }

  constructor() {
    this.loadFromStorage();
  }

  // Actions
  login(response: AuthResponse) {
    this.state.set({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    this.saveToStorage(response);
  }

  updateUser(user: User) {
    this.state.update((s) => ({
      ...s,
      user,
    }));
    // Update local storage user but keep tokens
    const current = sessionStorage.getItem('user');
    if (current) {
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  }

  logout() {
    this.state.set(initialState);
    this.clearStorage();
  }

  setLoading(isLoading: boolean) {
    this.state.update((s) => ({ ...s, isLoading }));
  }

  setError(error: string) {
    this.state.update((s) => ({ ...s, error, isLoading: false }));
  }

  // Storage Handling
  private saveToStorage(response: AuthResponse) {
    sessionStorage.setItem('access_token', response.accessToken);
    sessionStorage.setItem('refresh_token', response.refreshToken);
    sessionStorage.setItem('user', JSON.stringify(response.user));
  }

  private loadFromStorage() {
    const accessToken = sessionStorage.getItem('access_token');
    const refreshToken = sessionStorage.getItem('refresh_token');
    const userStr = sessionStorage.getItem('user');

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.state.set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (e) {
        console.error('Failed to parse user from storage', e);
        this.logout();
      }
    }
  }

  private clearStorage() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
  }
}
