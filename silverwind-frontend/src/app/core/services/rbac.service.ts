import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Role, Permission } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class RbacService {
  private api = inject(ApiService);

  getRoles() {
    return this.api.get<Role[]>('/rbac/roles');
  }
}
