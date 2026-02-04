export interface Job {
  id?: number;
  title: string;
  department: string;
  location: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  createdAt?: string;
  description?: string;
  requirements?: string;
}

export interface JobApplication {
  id?: number;
  jobId: number;
  candidateName: string;
  email: string;
  phone: string;
  experienceYears: number;
  currentCompany: string;
  noticePeriod: string;
  expectedCtc: string;
  resumeFilePath?: string;
  status: string;
  appliedAt?: string;
  latestAnalysis?: AnalysisResult;
  unreadCountForAdmin?: number;
}

export interface AnalysisResult {
  id: number;
  applicationId: number;
  analyzedAt: string;
  model: string;

  overallRiskScore: number;
  overallConsistencyScore: number;
  verificationPriorityScore: number;

  timelineRiskScore: number;
  skillInflationRiskScore: number;
  projectCredibilityRiskScore: number;
  authorshipRiskScore: number;
  confidenceScore: number;

  summary: string;
  redFlags: RedFlag[];
  evidence: Evidence[];
  interviewQuestions: { [key: string]: string[] };
}

export interface RedFlag {
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface Evidence {
  category: string;
  excerpt: string;
  locationHint: string;
}
