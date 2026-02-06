import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { User } from '../models/auth.model';
import { Page } from '../models/page.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/employees`;

  getUsers(page: number = 0, size: number = 20, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sort) params = params.set('sort', sort);
    return this.api.get<Page<User>>('/employees', params);
  }

  getUser(userId: string) {
    return this.api.get<User>(`/employees/${userId}`);
  }

  /**
   * Create a new user
   */
  createUser(data: any) {
    return this.api.post<User>('/employees', data);
  }

  /**
   * Update an existing user
   */
  updateUser(id: string, data: any) {
    return this.api.put<User>(`/employees/${id}`, data);
  }

  /**
   * Update account status (enabled/locked)
   */
  updateStatus(userId: string, enabled?: boolean, locked?: boolean) {
    return this.api.post<User>(`/employees/${userId}/status`, { enabled, accountLocked: locked });
  }

  /**
   * Update user manager
   */
  updateManager(userId: string, data: { managerId: string }) {
    return this.api.post<User>(`/employees/${userId}/manager`, data);
  }

  /**
   * Change user password (admin action)
   */
  changePassword(userId: string, data: { newPassword: string }) {
    return this.api.post<User>(`/employees/${userId}/password`, data);
  }

  /**
   * Update employment status (ACTIVE, INACTIVE, ON_LEAVE, etc.)
   */
  updateEmploymentStatus(userId: string, employmentStatus: string) {
    return this.api.post<User>(`/employees/${userId}/employment-status`, { employmentStatus });
  }

  /**
   * Convert a C2H employee to Full-Time Employee (FTE)
   */
  convertToFullTime(userId: string, conversionDate?: string) {
    return this.api.post<User>(`/employees/${userId}/convert-to-fte`, { conversionDate });
  }

  /**
   * Upload profile photo
   */
  uploadProfilePhoto(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/${userId}/photo`, formData)
      .pipe(map((res) => res.data));
  }

  /**
   * Get profile photo as blob
   */
  getProfilePhoto(userId: string): Observable<Blob> {
    // Blob responses are not wrapped in ApiResponse usually, confirming via controller logic
    // Controller logic: ResponseEntity<Resource> with contentType
    // So this remains as is.
    return this.http.get(`${this.baseUrl}/${userId}/photo`, { responseType: 'blob' });
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
