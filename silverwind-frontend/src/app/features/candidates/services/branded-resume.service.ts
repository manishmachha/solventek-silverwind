import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { BrandedResume } from '../models/branded-resume.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BrandedResumeService {
  private api = inject(ApiService);

  /** Get all branded resumes (Admin: all, Vendor: org-scoped) */
  getAll(): Observable<BrandedResume[]> {
    return this.api.get<BrandedResume[]>('/branded-resumes');
  }

  /** Get branded resume metadata by ID */
  getById(id: string): Observable<BrandedResume> {
    return this.api.get<BrandedResume>(`/branded-resumes/${id}`);
  }

  /** Download branded resume PDF by ID */
  download(id: string): Observable<Blob> {
    return this.api.download(`/branded-resumes/${id}/download`);
  }

  /** Get all versions for a candidate */
  getForCandidate(candidateId: string): Observable<BrandedResume[]> {
    return this.api.get<BrandedResume[]>(`/candidates/${candidateId}/branded-resumes`);
  }

  /** Get latest branded resume for a candidate */
  getLatest(candidateId: string): Observable<BrandedResume | null> {
    return this.api.get<BrandedResume | null>(`/candidates/${candidateId}/branded-resumes/latest`);
  }

  /** Download latest branded resume for a candidate */
  downloadLatest(candidateId: string): Observable<Blob> {
    return this.api.download(`/candidates/${candidateId}/branded-resumes/latest/download`);
  }

  /** Manually trigger regeneration */
  regenerate(candidateId: string): Observable<string> {
    return this.api.post<string>(`/candidates/${candidateId}/branded-resumes/regenerate`);
  }
}
