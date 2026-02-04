export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string; // Changed from string[] to matches backend string
  experience: string; // Changed from number to matches backend string
  documents: string[];
  createdAt: string;
}

export interface CandidateCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  documents: string[];
}
