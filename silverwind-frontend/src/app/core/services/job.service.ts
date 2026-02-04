import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import {
  Job,
  JobCreateRequest,
  JobEnrichRequest,
  JobFinalVerifyRequest,
} from '../../core/models/job.model';
import { Page } from '../../core/models/page.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private api = inject(ApiService);

  createJob(job: JobCreateRequest) {
    return this.api.post<Job>('/jobs', job);
  }

  getJobs(page: number = 0, size: number = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api.get<Page<Job>>('/jobs', params);
  }

  getJob(id: string) {
    return this.api.get<Job>(`/jobs/${id}`);
  }

  verifyJob(id: string) {
    return this.api.post<Job>(`/jobs/${id}/verify`, {});
  }

  enrichJob(id: string, data: JobEnrichRequest) {
    return this.api.post<Job>(`/jobs/${id}/enrich`, data);
  }

  finalVerifyJob(id: string, data: JobFinalVerifyRequest) {
    return this.api.post<Job>(`/jobs/${id}/approve`, data);
  }

  publishJob(id: string) {
    return this.api.post<Job>(`/jobs/${id}/publish`, {});
  }

  getPublishedJobs(page: number = 0, size: number = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api.get<Page<Job>>('/public/jobs', params);
  }
}
