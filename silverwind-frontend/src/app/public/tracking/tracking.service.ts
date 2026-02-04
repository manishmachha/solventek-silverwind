import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CandidateDashboardDTO {
  applicationId: number;
  candidateName: string;
  status: string;
  currentStage: string;
  appliedAt: string;
  timeline: TimelineEventDTO[];
  trackingToken: string;
  documents: DocumentDTO[];
}

export interface DocumentDTO {
  category: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  filePath: string;
}

export interface TimelineEventDTO {
  id: number;
  eventType: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tracking`;

  login(applicationId: number, dateOfBirth: string): Observable<CandidateDashboardDTO> {
    return this.http.post<CandidateDashboardDTO>(`${this.apiUrl}/login`, {
      applicationId,
      dateOfBirth,
    });
  }

  getDashboard(token: string): Observable<CandidateDashboardDTO> {
    return this.http.get<CandidateDashboardDTO>(`${this.apiUrl}/dashboard/${token}`);
  }

  addComment(applicationId: number, comment: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${applicationId}/comment`, { comment });
  }

  uploadDocument(applicationId: number, category: string, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return this.http.post<void>(`${this.apiUrl}/${applicationId}/documents`, formData);
  }
}
