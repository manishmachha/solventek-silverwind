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

export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: OrganizationSummary;
  internalOrg?: OrganizationSummary;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED';
  allocations?: ProjectAllocation[];
}

export interface ProjectAllocation {
  id: string;
  projectId?: string;
  projectName?: string;
  user: UserSummary;
  startDate: string;
  endDate?: string;
  allocationPercentage: number;
  billingRole?: string;
  status: 'ACTIVE' | 'ENDED' | 'PLANNED';
}
