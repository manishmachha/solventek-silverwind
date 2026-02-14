import { Organization } from './auth.model';

export type { Organization } from './auth.model';

// OrganizationSummary - matches backend ProjectResponse DTO
export interface OrganizationSummary {
  id: string;
  name: string;
  type?: string;
}

// UserSummary - matches backend UserSummary DTO for project allocations
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl?: string;
}

import { ClientSummary } from './client.model';
// UserSummary and OrganizationSummary are defined in this file, so no need to import them from auth.model here.

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED';
  client?: ClientSummary;
  internalOrg: OrganizationSummary;
  allocations?: ProjectAllocation[];
}

export interface ProjectAllocation {
  id: string;
  projectId?: string;
  projectName?: string;
  user?: UserSummary;
  candidateDetails?: UserSummary;
  startDate: string;
  endDate?: string;
  allocationPercentage: number;
  billingRole?: string;
  status: 'ACTIVE' | 'ENDED' | 'PLANNED';
}
