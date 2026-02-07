import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface Document {
  id: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  createdAt: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  location?: string;
  startDate: string;
  endDate?: string;
  currentJob: boolean;
  description?: string;
}

export interface Skill {
  id: string;
  skillName: string;
  proficiencyLevel?: string;
  yearsOfExperience?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/employees`;

  // --- Documents ---
  getDocuments(employeeId: string): Observable<ApiResponse<Document[]>> {
    return this.http.get<ApiResponse<Document[]>>(`${this.apiUrl}/${employeeId}/documents`);
  }

  uploadDocument(
    employeeId: string,
    file: File,
    type: string,
    name?: string,
  ): Observable<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (name) formData.append('name', name);

    return this.http.post<ApiResponse<Document>>(
      `${this.apiUrl}/${employeeId}/documents`,
      formData,
    );
  }

  deleteDocument(employeeId: string, documentId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${employeeId}/documents/${documentId}`,
    );
  }

  downloadDocumentUrl(employeeId: string, documentId: string): string {
    return `${this.apiUrl}/${employeeId}/documents/${documentId}/download`;
  }

  downloadDocument(employeeId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${employeeId}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
  }

  // --- Education ---
  getEducation(employeeId: string): Observable<ApiResponse<Education[]>> {
    return this.http.get<ApiResponse<Education[]>>(`${this.apiUrl}/${employeeId}/education`);
  }

  addEducation(
    employeeId: string,
    education: Partial<Education>,
  ): Observable<ApiResponse<Education>> {
    return this.http.post<ApiResponse<Education>>(
      `${this.apiUrl}/${employeeId}/education`,
      education,
    );
  }

  deleteEducation(employeeId: string, educationId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${employeeId}/education/${educationId}`,
    );
  }

  // --- Certifications ---
  getCertifications(employeeId: string): Observable<ApiResponse<Certification[]>> {
    return this.http.get<ApiResponse<Certification[]>>(
      `${this.apiUrl}/${employeeId}/certifications`,
    );
  }

  addCertification(
    employeeId: string,
    certification: Partial<Certification>,
  ): Observable<ApiResponse<Certification>> {
    return this.http.post<ApiResponse<Certification>>(
      `${this.apiUrl}/${employeeId}/certifications`,
      certification,
    );
  }

  deleteCertification(employeeId: string, certificationId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${employeeId}/certifications/${certificationId}`,
    );
  }

  // --- Work Experience ---
  getWorkExperience(employeeId: string): Observable<ApiResponse<WorkExperience[]>> {
    return this.http.get<ApiResponse<WorkExperience[]>>(
      `${this.apiUrl}/${employeeId}/work-experience`,
    );
  }

  addWorkExperience(
    employeeId: string,
    experience: Partial<WorkExperience>,
  ): Observable<ApiResponse<WorkExperience>> {
    return this.http.post<ApiResponse<WorkExperience>>(
      `${this.apiUrl}/${employeeId}/work-experience`,
      experience,
    );
  }

  deleteWorkExperience(employeeId: string, experienceId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${employeeId}/work-experience/${experienceId}`,
    );
  }

  // --- Skills ---
  getSkills(employeeId: string): Observable<ApiResponse<Skill[]>> {
    return this.http.get<ApiResponse<Skill[]>>(`${this.apiUrl}/${employeeId}/skills`);
  }

  addSkill(employeeId: string, skill: Partial<Skill>): Observable<ApiResponse<Skill>> {
    return this.http.post<ApiResponse<Skill>>(`${this.apiUrl}/${employeeId}/skills`, skill);
  }

  deleteSkill(employeeId: string, skillId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${employeeId}/skills/${skillId}`);
  }
}
