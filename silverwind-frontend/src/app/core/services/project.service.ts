import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Project, ProjectAllocation } from '../models/project.model';

// ========== REQUEST TYPES ==========

export interface CreateProjectRequest {
  name: string;
  description?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateStatusRequest {
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED';
}

export interface AllocateUserRequest {
  userId?: string;
  candidateId?: string;
  startDate: string;
  endDate?: string;
  percentage?: number;
  billingRole?: string;
}

export interface UpdateAllocationRequest {
  startDate?: string;
  endDate?: string;
  percentage?: number;
  billingRole?: string;
  status?: 'ACTIVE' | 'ENDED' | 'PLANNED';
}

// ========== SERVICE ==========

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private api = inject(ApiService);

  // ========== PROJECT CRUD ==========

  getProjects() {
    return this.api.get<Project[]>('/projects');
  }

  getProject(id: string) {
    return this.api.get<Project>(`/projects/${id}`);
  }

  createProject(request: CreateProjectRequest) {
    return this.api.post<Project>('/projects', request);
  }

  updateProject(id: string, request: UpdateProjectRequest) {
    return this.api.put<Project>(`/projects/${id}`, request);
  }

  updateStatus(id: string, request: UpdateStatusRequest) {
    return this.api.put<Project>(`/projects/${id}/status`, request);
  }

  deleteProject(id: string) {
    return this.api.delete<void>(`/projects/${id}`);
  }

  // ========== ALLOCATION MANAGEMENT ==========

  getAllocations(projectId: string) {
    return this.api.get<ProjectAllocation[]>(`/projects/${projectId}/allocations`);
  }

  allocateUser(projectId: string, request: AllocateUserRequest) {
    return this.api.post<ProjectAllocation>(`/projects/${projectId}/allocate`, request);
  }

  updateAllocation(projectId: string, allocationId: string, request: UpdateAllocationRequest) {
    return this.api.put<ProjectAllocation>(
      `/projects/${projectId}/allocations/${allocationId}`,
      request,
    );
  }

  deallocateUser(projectId: string, allocationId: string) {
    return this.api.delete<void>(`/projects/${projectId}/allocations/${allocationId}`);
  }
}
