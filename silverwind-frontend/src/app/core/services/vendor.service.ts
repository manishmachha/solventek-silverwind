import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Organization } from '../../core/models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private api = inject(ApiService);

  register(data: any) {
    return this.api.post<void>('/auth/register-vendor', data);
  }

  getPendingVendors() {
    return this.api.get<Organization[]>('/organizations/vendors/pending');
  }

  getVendors() {
    return this.api.get<Organization[]>('/organizations/vendors');
  }

  getVendorById(id: string) {
    return this.api.get<Organization>(`/organizations/${id}`);
  }

  approveVendor(id: string) {
    return this.api.post<void>(`/organizations/${id}/approve`, {});
  }

  rejectVendor(id: string) {
    return this.api.post<void>(`/organizations/${id}/reject`, {});
  }

  updateVendorStatus(id: string, status: string) {
    return this.api.patch<Organization>(`/organizations/${id}/status`, { status });
  }

}
