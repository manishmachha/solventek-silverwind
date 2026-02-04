import { Organization } from './auth.model';

export interface Holiday {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  name: string;
  description?: string;
  mandatory: boolean;
  organization?: Organization;
  createdAt?: string;
  updatedAt?: string;
}
