export interface Candidate {
  id: string; // UUID
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  currentDesignation?: string;
  currentCompany?: string;
  experienceYears?: number;
  skills?: string[];
  // Organization field might be needed if candidates belong to a vendor org
  // organizationId?: string;
}
