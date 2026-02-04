import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Project, ProjectAllocation } from '../models/project.model';

export interface CreateProjectRequest {
  name: string;
  description?: string;
  clientOrgId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AllocateUserRequest {
  userId: string;
  startDate: string;
  endDate?: string;
  percentage?: number;
  billingRole?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private api = inject(ApiService);

  getProjects() {
    return this.api.get<Project[]>('/projects');
  }

  createProject(request: CreateProjectRequest) {
    return this.api.post<Project>('/projects', request);
  }

  getAllocations(projectId: string) {
    return this.api.get<ProjectAllocation[]>(`/projects/${projectId}/allocations`);
  }

  allocateUser(projectId: string, request: AllocateUserRequest) {
    return this.api.post<ProjectAllocation>(`/projects/${projectId}/allocate`, request);
  }
}
