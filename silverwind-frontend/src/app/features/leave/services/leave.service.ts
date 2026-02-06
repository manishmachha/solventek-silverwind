import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../../core/models/api-response.model';
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
    return this.http
      .get<ApiResponse<LeaveType[]>>(`${this.apiUrl}/v1/leaves/types`)
      .pipe(map((res) => res.data));
  }

  createLeaveType(leaveType: LeaveType): Observable<LeaveType> {
    return this.http
      .post<ApiResponse<LeaveType>>(`${this.apiUrl}/v1/admin/leave-types`, leaveType)
      .pipe(map((res) => res.data));
  }

  deleteLeaveType(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/v1/admin/leave-types/${id}`)
      .pipe(map(() => void 0));
  }

  // --- User Operations ---

  applyForLeave(request: LeaveRequest): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/v1/leaves/apply`, request)
      .pipe(map(() => void 0));
  }

  getMyRequests(): Observable<LeaveResponse[]> {
    return this.http
      .get<ApiResponse<LeaveResponse[]>>(`${this.apiUrl}/v1/leaves/my-requests`)
      .pipe(map((res) => res.data));
  }

  getMyBalances(year?: number): Observable<LeaveBalance[]> {
    const url = year
      ? `${this.apiUrl}/v1/leaves/balances?year=${year}`
      : `${this.apiUrl}/v1/leaves/balances`;
    return this.http.get<ApiResponse<LeaveBalance[]>>(url).pipe(map((res) => res.data));
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
    return this.http
      .get<ApiResponse<any>>(`${this.apiUrl}/v1/leaves/admin/requests`, { params })
      .pipe(map((res) => res.data));
  }

  getUserBalances(userId: string, year?: number): Observable<LeaveBalance[]> {
    const url = year
      ? `${this.apiUrl}/v1/leaves/admin/balances/${userId}?year=${year}`
      : `${this.apiUrl}/v1/leaves/admin/balances/${userId}`;
    return this.http.get<ApiResponse<LeaveBalance[]>>(url).pipe(map((res) => res.data));
  }

  getPendingRequests(): Observable<LeaveResponse[]> {
    // Keeping for backward compat if needed, or remove
    return this.http
      .get<ApiResponse<LeaveResponse[]>>(`${this.apiUrl}/v1/leaves/pending`)
      .pipe(map((res) => res.data));
  }

  takeAction(action: LeaveAction): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/v1/leaves/action`, action)
      .pipe(map(() => void 0));
  }
}
