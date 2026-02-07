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

  // View Role Signal (for simulation)
  private _viewRole = signal<string | null>(null);

  // Selectors (Computed)
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly accessToken = computed(() => this.state().accessToken);

  // The actual role of the logged-in user (immutable by view toggle)
  readonly actualRole = computed(() => {
    return this.state().user?.role?.name || null;
  });

  // The effective role (affected by view toggle)
  readonly userRole = computed(() => {
    return this._viewRole() || this.actualRole();
  });

  // Expose view role for UI binding
  readonly viewRole = computed(() => this._viewRole());

  readonly organizationId = computed(() => this.state().user?.orgId);
  readonly orgType = computed(() => this.state().user?.orgType);
  readonly organizationName = computed(() => this.state().user?.organization?.name);

  readonly permissions = computed(() => {
    return [];
  });

  hasPermission(code: string): boolean {
    if (this.actualRole() === 'SUPER_ADMIN') return true;
    return false;
  }

  // Role Helper Methods - operate on effective role (userRole)
  // except for permission checks which should ideally use actualRole if they are for critical ops,
  // but here they drive UI, so userRole is appropriate.
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
    return ['SUPER_ADMIN', 'HR_ADMIN'].includes(this.userRole() || '');
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

  setViewRole(role: string | null) {
    // If the requested view role is the same as actual role, clear the view role
    if (role === this.actualRole()) {
      this._viewRole.set(null);
    } else {
      this._viewRole.set(role);
    }
  }

  logout() {
    this.state.set(initialState);
    this._viewRole.set(null);
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
