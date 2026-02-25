export interface BrandedResume {
  id: string;
  version: number;
  filePath: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  revampedContentJson?: string;
  generationNotes?: string;
  createdAt: string;
  updatedAt: string;
  candidate?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    currentDesignation?: string;
  };
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}
