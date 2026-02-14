export interface Client {
  id: string; // UUID
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  industry?: string;
  address?: string;
}

export interface ClientSummary {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
}
