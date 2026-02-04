import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payroll, SalaryRevision, SalaryStructure } from '../models/payroll.model';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payroll`;

  // ============ EMPLOYEE SELF-SERVICE ============

  getMyPayslips(): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(`${this.baseUrl}/my-slips`);
  }

  getMySalaryStructure(): Observable<SalaryStructure> {
    return this.http.get<SalaryStructure>(`${this.baseUrl}/my-structure`);
  }

  getMyPayrollHistory(year: number): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(`${this.baseUrl}/my/history`, {
      params: new HttpParams().set('year', year),
    });
  }

  getMySalaryRevisions(): Observable<SalaryRevision[]> {
    return this.http.get<SalaryRevision[]>(`${this.baseUrl}/salary-revisions/my`);
  }

  downloadPayslip(payrollId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${payrollId}/download`, {
      responseType: 'blob',
    });
  }

  // ============ ADMIN ENDPOINTS ============

  getAllSalaryStructures(): Observable<SalaryStructure[]> {
    return this.http.get<SalaryStructure[]>(`${this.baseUrl}/structures`);
  }

  getEmployeeSalaryStructure(userId: string): Observable<SalaryStructure> {
    return this.http.get<SalaryStructure>(`${this.baseUrl}/employee/${userId}/structure`);
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

    return this.http.post<SalaryStructure>(`${this.baseUrl}/employee/${userId}/structure`, null, {
      params,
    });
  }

  generatePayroll(userId: string, month: number, year: number): Observable<Payroll> {
    const params = new HttpParams().set('userId', userId).set('month', month).set('year', year);
    return this.http.post<Payroll>(`${this.baseUrl}/generate`, null, { params });
  }

  markAsPaid(payrollId: string): Observable<Payroll> {
    return this.http.patch<Payroll>(`${this.baseUrl}/${payrollId}/pay`, null);
  }

  getPayrollHistory(month: number, year: number): Observable<Payroll[]> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<Payroll[]>(`${this.baseUrl}/history`, { params });
  }

  getEmployeePayrollHistory(userId: string): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(`${this.baseUrl}/employee/${userId}/history`);
  }

  getEmployeeSalaryRevisions(userId: string): Observable<SalaryRevision[]> {
    return this.http.get<SalaryRevision[]>(`${this.baseUrl}/salary-revisions/${userId}`);
  }
}
