import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ClientSubmission {
  id: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
  };
  client: {
    id: string;
    name: string;
  };
  job?: {
    id: string;
    title: string;
  };
  status: ClientSubmissionStatus;
  externalReferenceId?: string;
  remarks?: string;
  submittedAt: string;
  submittedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export type ClientSubmissionStatus =
  | 'SUBMITTED'
  | 'CLIENT_SCREENING'
  | 'CLIENT_INTERVIEW'
  | 'CLIENT_OFFERED'
  | 'CLIENT_REJECTED'
  | 'ONBOARDING'
  | 'WITHDRAWN';

export interface CreateSubmissionRequest {
  candidateId: string;
  clientId: string;
  jobId?: string;
  externalReferenceId?: string;
  remarks?: string;
}

export interface UpdateStatusRequest {
  status: ClientSubmissionStatus;
  remarks?: string;
}

export interface ClientSubmissionComment {
  id: string;
  commentText: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
  };
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
  error?: any;
  meta?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ClientSubmissionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/client-submissions`;

  getSubmissionsByCandidate(candidateId: string): Observable<ClientSubmission[]> {
    return this.http
      .get<ApiResponse<ClientSubmission[]>>(`${this.apiUrl}?candidateId=${candidateId}`)
      .pipe(map((res) => res.data));
  }

  getSubmissionsByClient(clientId: string): Observable<ClientSubmission[]> {
    return this.http
      .get<ApiResponse<ClientSubmission[]>>(`${this.apiUrl}?clientId=${clientId}`)
      .pipe(map((res) => res.data));
  }

  createSubmission(request: CreateSubmissionRequest): Observable<ClientSubmission> {
    return this.http
      .post<ApiResponse<ClientSubmission>>(this.apiUrl, request)
      .pipe(map((res) => res.data));
  }

  updateStatus(id: string, request: UpdateStatusRequest): Observable<ClientSubmission> {
    return this.http
      .put<ApiResponse<ClientSubmission>>(`${this.apiUrl}/${id}/status`, request)
      .pipe(map((res) => res.data));
  }

  updateDetails(
    id: string,
    externalReferenceId?: string,
    remarks?: string,
  ): Observable<ClientSubmission> {
    return this.http
      .put<ApiResponse<ClientSubmission>>(`${this.apiUrl}/${id}`, {
        externalReferenceId,
        remarks,
      })
      .pipe(map((res) => res.data));
  }

  getComments(submissionId: string): Observable<ClientSubmissionComment[]> {
    return this.http
      .get<ApiResponse<ClientSubmissionComment[]>>(`${this.apiUrl}/${submissionId}/comments`)
      .pipe(map((res) => res.data));
  }

  addComment(submissionId: string, commentText: string): Observable<ClientSubmissionComment> {
    return this.http
      .post<
        ApiResponse<ClientSubmissionComment>
      >(`${this.apiUrl}/${submissionId}/comments`, { commentText })
      .pipe(map((res) => res.data));
  }
}
