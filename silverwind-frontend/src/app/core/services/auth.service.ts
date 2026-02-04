import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthStore } from '../stores/auth.store';
import { User, AuthResponse } from '../models/auth.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(ApiService);
  private store = inject(AuthStore);

  login(credentials: { email: string; password: string }) {
    return this.api
      .post<AuthResponse>('/auth/login', credentials)
      .pipe(tap((response) => this.store.login(response)));
  }

  refreshUser() {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => {
        this.store.updateUser(user as User);
      }),
    );
  }

  registerVendor(data: any) {
    return this.api.post('/auth/register-vendor', data);
  }

  logout() {
    this.store.logout();
    // Optional: Call network endpoint if needed
  }
}
