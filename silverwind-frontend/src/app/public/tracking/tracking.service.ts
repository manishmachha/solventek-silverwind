import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CandidateDashboardDTO {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
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

  login(applicationId: string, dateOfBirth: string): Observable<CandidateDashboardDTO> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, {
        applicationId,
        dateOfBirth,
      })
      .pipe(map((response) => response.data));
  }

  getDashboard(token: string): Observable<CandidateDashboardDTO> {
    return this.http
      .get<any>(`${this.apiUrl}/dashboard/${token}`)
      .pipe(map((response) => response.data));
  }

  addComment(applicationId: string, comment: string): Observable<void> {
    return this.http
      .post<any>(`${this.apiUrl}/${applicationId}/comment`, { comment })
      .pipe(map((response) => response.data));
  }

  uploadDocument(applicationId: string, category: string, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return this.http
      .post<any>(`${this.apiUrl}/${applicationId}/documents`, formData)
      .pipe(map((response) => response.data));
  }
}
