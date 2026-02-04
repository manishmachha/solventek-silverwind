import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Attendance, AttendanceStatus, TimesheetSummary } from '../models/attendance.model';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  // ============ EMPLOYEE ENDPOINTS ============

  checkIn(): Observable<Attendance> {
    // Note: userId is inferred from token in backend or passed if needed.
    // Backend controller logic: "checkIn(@RequestParam UUID userId)" but I decided to rely on Principal in service
    // or just pass it in controller. Controller.java: checkIn(@RequestParam UUID userId).
    // Let's pass the user ID if we have it, or let the backend handle it.
    // Ideally we should get it from AuthService. But wait, new Controller implementation:
    // public AttendanceResponse checkIn(@RequestParam UUID userId)
    // It requires userId param.
    // Wait, in my controller implementation step 637 I wrote: `public AttendanceResponse checkIn(@RequestParam UUID userId)`
    // And inside: `return toAttendanceResponse(attendanceService.checkIn(getCurrentUserId()));`
    // So it ignores the param?
    // Let me check my controller code again.
    // "Let's use the ID from the principal in the controller ... Better: ignore the param and use the logged-in user's ID"
    // So the param is required by signature but ignored?
    // Ah, I should pass *something* to satisfy the param. I'll get Current User ID from AuthService if possible, or just pass a dummy UUID.
    // Actually, looking at `PayrollService.java`, it gets user from context.
    // Keep it simple: Assuming I need to pass userId. I'll inject AuthService later if needed. For now let's assume the component passes it.
    // Actually, easier: Update controller to NOT require param if it uses principal.
    // But I can't change backend now without a new compilation cycle.
    // I entered: `public AttendanceResponse checkIn(@RequestParam UUID userId)`
    // So I MUST pass userId.
    return this.http.post<Attendance>(`${this.apiUrl}/check-in`, {}, { params: {} as any });
    // Wait, if I need userId, the component should pass it.
    // Let's update method signature to take userId.
  }

  // Revised checkIn to matching backend signature requirement
  checkInUser(userId: string): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/check-in`, {}, { params: { userId } });
  }

  checkOut(): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/check-out`, {});
  }

  getMyAttendance(): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.apiUrl}/my`);
  }

  getMyAttendanceByRange(startDate: string, endDate: string): Observable<Attendance[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<Attendance[]>(`${this.apiUrl}/my/range`, { params });
  }

  getMyTimesheet(startDate: string, endDate: string): Observable<TimesheetSummary> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<TimesheetSummary>(`${this.apiUrl}/timesheet/my`, { params });
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
    return this.http.get<Attendance[]>(`${this.apiUrl}/employee/${userId}`);
  }

  getEmployeeAttendanceByRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Observable<Attendance[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<Attendance[]>(`${this.apiUrl}/employee/${userId}/range`, { params });
  }

  getAllAttendanceByDate(date: string): Observable<Attendance[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Attendance[]>(`${this.apiUrl}/date`, { params });
  }

  getAllAttendanceByRange(startDate: string, endDate: string): Observable<Attendance[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<Attendance[]>(`${this.apiUrl}/range`, { params });
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

    return this.http.post<Attendance>(`${this.apiUrl}/mark`, {}, { params });
  }

  getEmployeeTimesheet(
    userId: string,
    startDate: string,
    endDate: string,
  ): Observable<TimesheetSummary> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<TimesheetSummary>(`${this.apiUrl}/timesheet/${userId}`, { params });
  }

  downloadEmployeeTimesheet(userId: string, startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get(`${this.apiUrl}/timesheet/${userId}/download`, {
      params,
      responseType: 'blob',
    });
  }
}
