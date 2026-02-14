import { Job } from './job.model';
import { Candidate } from './candidate.model';
import { Organization } from './auth.model';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_PASSED'
  | 'INTERVIEW_FAILED'
  | 'OFFERED'
  | 'ONBOARDING_IN_PROGRESS'
  | 'ONBOARDED'
  | 'CONVERTED_TO_FTE'
  | 'DROPPED';

export interface JobApplication {
  id: string;
  job: Job;
  candidate: Candidate;

  // Flat fields matching Backend
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  resumeUrl?: string;
  resumeFilePath?: string;

  currentTitle?: string;
  currentCompany?: string;
  experienceYears?: number;
  location?: string;
  skills?: string[];

  vendor?: Organization; // Applicant Org

  status: ApplicationStatus;

  resumeText?: string; // For AI Analysis display

  createdAt: string; // BaseEntity field - when application was created/applied
  updatedAt: string;

  // Transient / Joined fields
  latestAnalysis?: any;
}

export interface ApplyRequest {
  candidateId: string;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}
