import { User, Organization } from './auth.model';

export type JobStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ADMIN_VERIFIED'
  | 'TA_ENRICHED'
  | 'ADMIN_FINAL_VERIFIED'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CLOSED';
export type EmploymentType = 'FULL_TIME' | 'CONTRACT' | 'C2H' | 'FREELANCE' | 'PART_TIME';

export interface Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  employmentType: EmploymentType;
  organization?: Organization;
  organizationId?: string;
  location?: string;
  requirements?: string;
  rolesAndResponsibilities?: string;
  experience?: string;
  skills?: string;
  department?: string;
  billRate?: number;
  payRate?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobCreateRequest {
  title: string;
  description: string;
  employmentType: EmploymentType;
  requirements?: string;
  rolesAndResponsibilities?: string;
  experience?: string;
  skills?: string;
  billRate?: number;
  payRate?: number;
  status?: JobStatus;
}

export interface JobEnrichRequest {
  requirements: string;
  rolesAndResponsibilities: string;
  experience: string;
  skills: string;
}

export interface JobFinalVerifyRequest {
  billRate: number;
  payRate: number;
}
