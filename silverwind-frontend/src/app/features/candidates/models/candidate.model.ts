export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  currentDesignation?: string;
  currentCompany?: string;
  experienceYears?: number;
  skills: string[];
  summary?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  resumeFilePath?: string;
  resumeOriginalFileName?: string;
  experienceDetailsJson?: string;
  educationDetailsJson?: string;
  aiAnalysisJson?: string;
  organization?: {
    id: string;
    name: string;
    type: string;
    email?: string;
    phone?: string;
    website?: string;
    city?: string;
    country?: string;
    logoUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CandidateExperience {
  company: string;
  title: string;
  start: string;
  end: string;
  isCurrent: boolean;
  description?: string;
}
