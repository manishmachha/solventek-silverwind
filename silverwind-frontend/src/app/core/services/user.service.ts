import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  User,
  CreateEmployeeRequest,
  PersonalDetailsRequest,
  EmploymentDetailsRequest,
  ContactInfoRequest,
  BankDetailsRequest,
  UpdateManagerRequest,
  ChangePasswordRequest,
  EmploymentStatusRequest,
  ConvertToFteRequest,
  UpdateStatusRequest,
} from '../models/auth.model';
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
   * Create a new employee
   */
  createUser(data: CreateEmployeeRequest) {
    return this.api.post<User>('/employees', data);
  }

  /**
   * Update an existing employee
   */
  updateUser(id: string, data: CreateEmployeeRequest) {
    return this.api.put<User>(`/employees/${id}`, data);
  }

  /**
   * Update personal details
   */
  updatePersonal(userId: string, data: PersonalDetailsRequest) {
    return this.api.post<User>(`/employees/${userId}/personal`, data);
  }

  /**
   * Update employment details
   */
  updateEmployment(userId: string, data: EmploymentDetailsRequest) {
    return this.api.post<User>(`/employees/${userId}/employment`, data);
  }

  /**
   * Update contact info
   */
  updateContact(userId: string, data: ContactInfoRequest) {
    return this.api.post<User>(`/employees/${userId}/contact`, data);
  }

  /**
   * Update bank details
   */
  updateBankDetails(userId: string, data: BankDetailsRequest) {
    return this.api.post<User>(`/employees/${userId}/bank`, data);
  }

  /**
   * Update account status (enabled/locked)
   */
  updateStatus(userId: string, data: UpdateStatusRequest) {
    return this.api.post<User>(`/employees/${userId}/status`, data);
  }

  /**
   * Update user manager
   */
  updateManager(userId: string, data: UpdateManagerRequest) {
    return this.api.post<User>(`/employees/${userId}/manager`, data);
  }

  /**
   * Change user password (admin action)
   */
  changePassword(userId: string, data: ChangePasswordRequest) {
    return this.api.post<User>(`/employees/${userId}/password`, data);
  }

  /**
   * Update employment status (ACTIVE, INACTIVE, ON_LEAVE, etc.)
   */
  updateEmploymentStatus(userId: string, data: EmploymentStatusRequest) {
    return this.api.post<User>(`/employees/${userId}/employment-status`, data);
  }

  /**
   * Convert a C2H employee to Full-Time Employee (FTE)
   */
  convertToFullTime(userId: string, data?: ConvertToFteRequest) {
    return this.api.post<User>(`/employees/${userId}/convert-to-fte`, data || {});
  }

  /**
   * Upload profile photo
   */
  uploadProfilePhoto(userId: string, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<User>>(`${this.baseUrl}/${userId}/photo`, formData)
      .pipe(map((res) => res.data));
  }

  /**
   * Get profile photo as blob
   */
  getProfilePhoto(userId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${userId}/photo`, { responseType: 'blob' });
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
