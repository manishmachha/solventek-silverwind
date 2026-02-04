import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ChartData {
  label: string;
  value: number;
}

export interface DashboardStats {
  employeesByDepartment: ChartData[];
  projectsByStatus: ChartData[];
  assetsByType: ChartData[];
  employeeStatusDistribution: ChartData[];
  projectsByClient: ChartData[];
  recruitmentPipeline: ChartData[];
  totalActiveJobs: number;
  totalEmployees: number;
  totalApplications: number;
  pendingApprovals: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/dashboard/stats`;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}
