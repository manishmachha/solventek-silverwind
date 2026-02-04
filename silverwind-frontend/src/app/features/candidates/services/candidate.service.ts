import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Candidate } from '../models/candidate.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CandidateService {
  private api = inject(ApiService);
  private readonly BASE_URL = '/candidates';

  /**
   * Get all candidates (Vendor gets theirs, Admin gets all)
   */
  getCandidates(): Observable<Candidate[]> {
    return this.api.get<Candidate[]>(this.BASE_URL);
  }

  /**
   * Get a single candidate by ID
   */
  getCandidate(id: string): Observable<Candidate> {
    return this.api.get<Candidate>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Create a candidate by uploading a resume (AI Parsing)
   */
  updateResume(id: string, file: File): Observable<Candidate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Candidate>(`${this.BASE_URL}/${id}/resume`, formData);
  }

  uploadResume(file: File): Observable<Candidate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Candidate>(`${this.BASE_URL}/upload`, formData);
  }

  /**
   * Update candidate details
   */
  updateCandidate(id: string, data: Partial<Candidate>): Observable<Candidate> {
    return this.api.put<Candidate>(`${this.BASE_URL}/${id}`, data);
  }

  /**
   * Delete candidate
   */
  deleteCandidate(id: string): Observable<void> {
    return this.api.delete<void>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Download resume file
   */
  downloadResume(id: string): Observable<Blob> {
    return this.api.download(`${this.BASE_URL}/${id}/resume`);
  }
}
