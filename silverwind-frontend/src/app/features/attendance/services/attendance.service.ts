import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Attendance, AttendanceStatus, TimesheetSummary } from '../models/attendance.model';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  // ============ EMPLOYEE ENDPOINTS ============

  checkIn(): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/check-in`, {}, { params: {} as any });
  }

  // Revised checkIn to matching backend signature requirement
  checkInUser(userId: string): Observable<Attendance> {
    return this.http
      .post<ApiResponse<Attendance>>(`${this.apiUrl}/check-in`, {}, { params: { userId } })
      .pipe(map((res) => res.data));
  }

  checkOut(): Observable<Attendance> {
    return this.http
      .post<ApiResponse<Attendance>>(`${this.apiUrl}/check-out`, {})
      .pipe(map((res) => res.data));
  }

  getMyAttendance(): Observable<Attendance[]> {
    return this.http
      .get<ApiResponse<Attendance[]>>(`${this.apiUrl}/my`)
      .pipe(map((res) => res.data));
  }

  getMyAttendanceByRange(startDate: string, endDate: string): Observable<Attendance[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http
      .get<ApiResponse<Attendance[]>>(`${this.apiUrl}/my/range`, { params })
      .pipe(map((res) => res.data));
  }

  getMyTimesheet(startDate: string, endDate: string): Observable<TimesheetSummary> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http
      .get<ApiResponse<TimesheetSummary>>(`${this.apiUrl}/timesheet/my`, { params })
      .pipe(map((res) => res.data));
  }

  downloadMyTimesheet(startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get(`${this.apiUrl}/timesheet/my/download`, {
      params,
      responseType: 'blob',
    });
  }

  // ============ ADMIN ENDPOINTS ============

  getEmployeeAttendance(userId: string): Observable<Attendance[]> {
    return this.http
      .get<ApiResponse<Attendance[]>>(`${this.apiUrl}/employee/${userId}`)
      .pipe(map((res) => res.data));
  }

  getEmployeeAttendanceByRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Observable<Attendance[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http
      .get<ApiResponse<Attendance[]>>(`${this.apiUrl}/employee/${userId}/range`, { params })
      .pipe(map((res) => res.data));
  }

  getAllAttendanceByDate(date: string): Observable<Attendance[]> {
    const params = new HttpParams().set('date', date);
    return this.http
      .get<ApiResponse<Attendance[]>>(`${this.apiUrl}/date`, { params })
      .pipe(map((res) => res.data));
  }

  getAllAttendanceByRange(startDate: string, endDate: string): Observable<Attendance[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http
      .get<ApiResponse<Attendance[]>>(`${this.apiUrl}/range`, { params })
      .pipe(map((res) => res.data));
  }

  markAttendance(
    userId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string,
  ): Observable<Attendance> {
    let params = new HttpParams().set('userId', userId).set('date', date).set('status', status);

    if (notes) {
      params = params.set('notes', notes);
    }

    return this.http
      .post<ApiResponse<Attendance>>(`${this.apiUrl}/mark`, {}, { params })
      .pipe(map((res) => res.data));
  }

  getEmployeeTimesheet(
    userId: string,
    startDate: string,
    endDate: string,
  ): Observable<TimesheetSummary> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http
      .get<ApiResponse<TimesheetSummary>>(`${this.apiUrl}/timesheet/${userId}`, { params })
      .pipe(map((res) => res.data));
  }

  downloadEmployeeTimesheet(userId: string, startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get(`${this.apiUrl}/timesheet/${userId}/download`, {
      params,
      responseType: 'blob',
    });
  }
}
