import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Payroll, SalaryRevision, SalaryStructure } from '../models/payroll.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payroll`;

  // ============ EMPLOYEE SELF-SERVICE ============

  getMyPayslips(): Observable<Payroll[]> {
    return this.http
      .get<ApiResponse<Payroll[]>>(`${this.baseUrl}/my-slips`)
      .pipe(map((res) => res.data));
  }

  getMySalaryStructure(): Observable<SalaryStructure> {
    return this.http
      .get<ApiResponse<SalaryStructure>>(`${this.baseUrl}/my-structure`)
      .pipe(map((res) => res.data));
  }

  getMyPayrollHistory(year: number): Observable<Payroll[]> {
    return this.http
      .get<ApiResponse<Payroll[]>>(`${this.baseUrl}/my/history`, {
        params: new HttpParams().set('year', year),
      })
      .pipe(map((res) => res.data));
  }

  getMySalaryRevisions(): Observable<SalaryRevision[]> {
    return this.http
      .get<ApiResponse<SalaryRevision[]>>(`${this.baseUrl}/salary-revisions/my`)
      .pipe(map((res) => res.data));
  }

  downloadPayslip(payrollId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${payrollId}/download`, {
      responseType: 'blob',
    });
  }

  // ============ ADMIN ENDPOINTS ============

  getAllSalaryStructures(): Observable<SalaryStructure[]> {
    return this.http
      .get<ApiResponse<SalaryStructure[]>>(`${this.baseUrl}/structures`)
      .pipe(map((res) => res.data));
  }

  getEmployeeSalaryStructure(userId: string): Observable<SalaryStructure> {
    return this.http
      .get<ApiResponse<SalaryStructure>>(`${this.baseUrl}/employee/${userId}/structure`)
      .pipe(map((res) => res.data));
  }

  saveSalaryStructure(
    userId: string,
    data: {
      basic: number;
      da: number;
      hra: number;
      medicalAllowance: number;
      specialAllowance: number;
      lta: number;
      communicationAllowance: number;
      otherEarnings: number;
      epfDeduction: number;
    },
  ): Observable<SalaryStructure> {
    const params = new HttpParams()
      .set('basic', data.basic)
      .set('da', data.da)
      .set('hra', data.hra)
      .set('medicalAllowance', data.medicalAllowance)
      .set('specialAllowance', data.specialAllowance)
      .set('lta', data.lta)
      .set('communicationAllowance', data.communicationAllowance)
      .set('otherEarnings', data.otherEarnings)
      .set('epfDeduction', data.epfDeduction);

    return this.http
      .post<ApiResponse<SalaryStructure>>(`${this.baseUrl}/employee/${userId}/structure`, null, {
        params,
      })
      .pipe(map((res) => res.data));
  }

  generatePayroll(userId: string, month: number, year: number): Observable<Payroll> {
    const params = new HttpParams().set('userId', userId).set('month', month).set('year', year);
    return this.http
      .post<ApiResponse<Payroll>>(`${this.baseUrl}/generate`, null, { params })
      .pipe(map((res) => res.data));
  }

  markAsPaid(payrollId: string): Observable<Payroll> {
    return this.http
      .patch<ApiResponse<Payroll>>(`${this.baseUrl}/${payrollId}/pay`, null)
      .pipe(map((res) => res.data));
  }

  getPayrollHistory(month: number, year: number): Observable<Payroll[]> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http
      .get<ApiResponse<Payroll[]>>(`${this.baseUrl}/history`, { params })
      .pipe(map((res) => res.data));
  }

  getEmployeePayrollHistory(userId: string): Observable<Payroll[]> {
    return this.http
      .get<ApiResponse<Payroll[]>>(`${this.baseUrl}/employee/${userId}/history`)
      .pipe(map((res) => res.data));
  }

  getEmployeeSalaryRevisions(userId: string): Observable<SalaryRevision[]> {
    return this.http
      .get<ApiResponse<SalaryRevision[]>>(`${this.baseUrl}/salary-revisions/${userId}`)
      .pipe(map((res) => res.data));
  }
}
