export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'tech' | 'management' | 'design' | 'consulting'; // Added consulting
  features?: string[]; // New: For detailed service page
}

export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  category: string;
  description: string;
  results: string[];
  imageUrl: string;
  challenge?: string; // New
  solution?: string; // New
}

export interface Leader {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  quote?: string;
}

export interface JobOpening {
  id: string;
  title: string;
  location: string;
  type: string; // Full-time, Contract
  description: string;
}
