import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import {
  LeaveType,
  LeaveRequest,
  LeaveResponse,
  LeaveBalance,
  LeaveAction,
} from '../models/leave.model';

@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // --- Admin Configuration ---

  getAllLeaveTypes(): Observable<LeaveType[]> {
    return this.http.get<LeaveType[]>(`${this.apiUrl}/v1/leaves/types`);
  }

  createLeaveType(leaveType: LeaveType): Observable<LeaveType> {
    return this.http.post<LeaveType>(`${this.apiUrl}/v1/admin/leave-types`, leaveType);
  }

  deleteLeaveType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/v1/admin/leave-types/${id}`);
  }

  // --- User Operations ---

  applyForLeave(request: LeaveRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/v1/leaves/apply`, request);
  }

  getMyRequests(): Observable<LeaveResponse[]> {
    return this.http.get<LeaveResponse[]>(`${this.apiUrl}/v1/leaves/my-requests`);
  }

  getMyBalances(year?: number): Observable<LeaveBalance[]> {
    const url = year
      ? `${this.apiUrl}/v1/leaves/balances?year=${year}`
      : `${this.apiUrl}/v1/leaves/balances`;
    return this.http.get<LeaveBalance[]>(url);
  }

  // --- Admin Operations ---

  getAllRequests(
    page: number,
    size: number,
    search?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Observable<any> {
    let params: any = { page, size };
    if (search) params.search = search;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return this.http.get<any>(`${this.apiUrl}/v1/leaves/admin/requests`, { params });
  }

  getUserBalances(userId: string, year?: number): Observable<LeaveBalance[]> {
    const url = year
      ? `${this.apiUrl}/v1/leaves/admin/balances/${userId}?year=${year}`
      : `${this.apiUrl}/v1/leaves/admin/balances/${userId}`;
    return this.http.get<LeaveBalance[]>(url);
  }

  getPendingRequests(): Observable<LeaveResponse[]> {
    // Keeping for backward compat if needed, or remove
    return this.http.get<LeaveResponse[]>(`${this.apiUrl}/v1/leaves/pending`);
  }

  takeAction(action: LeaveAction): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/v1/leaves/action`, action);
  }
}
