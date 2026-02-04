import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Organization } from '../models/auth.model';

export interface Job {
  id: string;
  title: string;
  description: string;
  organization: Organization;
  // Add other fields as needed
  status: string;
  employmentType: string;
  createdAt?: string;
}

import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  getApprovedOrganizations() {
    return this.api.get<Organization[]>('/organizations/discovery');
  }

  getOrganizationById(id: string) {
    return this.api.get<Organization>(`/organizations/${id}`);
  }

  getPublicJobs(orgId: string) {
    return this.api.get<Job[]>(`/organizations/${orgId}/public-jobs`);
  }

  updateOrganization(id: string, data: any) {
    return this.api.put<Organization>(`/organizations/${id}`, data);
  }

  uploadLogo(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<string>(`${environment.apiUrl}/organizations/${id}/logo`, formData);
  }
}
