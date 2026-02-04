import { Organization } from './auth.model';

export type { Organization } from './auth.model';

// Use the imported Organization interface

export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: Organization;
  internalOrg?: Organization;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED';
  allocations?: ProjectAllocation[];
}

export interface ProjectAllocation {
  id: string;
  project: Project;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl?: string;
  };
  startDate: string;
  endDate?: string;
  allocationPercentage: number;
  billingRole?: string;
  status: 'ACTIVE' | 'ENDED' | 'PLANNED';
}
