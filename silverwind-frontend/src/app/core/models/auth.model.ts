// Organization Types - The three types of organizations in the system
export type OrganizationType = 'SOLVENTEK' | 'VENDOR';

export type OrganizationStatus =
  | 'PENDING_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'INACTIVE';

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  type: OrganizationType;
  status: OrganizationStatus;
  logoUrl?: string;
  primaryContact?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  taxId?: string;
  // Extended Vendor/Client Properties
  industry?: string;
  description?: string;
  employeeCount?: number;
  yearsInBusiness?: number;
  registrationNumber?: string;
  serviceOfferings?: string;
  keyClients?: string;
  contactPersonName?: string;
  contactPersonDesignation?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  referralSource?: string;
  createdAt: string;
  updatedAt: string;
}

// Standardized Roles
export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'TA' | 'EMPLOYEE' | 'VENDOR';

export interface Permission {
  code: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  organization?: Organization;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  orgId: string;
  orgType: OrganizationType;
  role: Role; // Single Role
  organization?: Organization;
  createdAt?: string;
  updatedAt?: string;

  // Personal fields
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  profilePhotoUrl?: string;

  // Employment fields
  employeeCode?: string;
  username?: string;
  dateOfJoining?: string;
  employmentStatus?: 'ACTIVE' | 'INACTIVE' | 'ON_NOTICE' | 'TERMINATED' | 'RESIGNED' | 'ON_LEAVE';
  department?: string;
  designation?: string;
  employmentType?: 'FTE' | 'CONTRACT' | 'C2H' | 'INTERN' | 'PART_TIME';
  workLocation?: string;
  gradeLevel?: string;

  // Manager
  manager?: User;
  managerId?: string;

  // Security/Access
  enabled?: boolean;
  accountLocked?: boolean;
  failedLoginAttempts?: number;
  lockUntil?: string;
  lastLoginAt?: string;
  passwordUpdatedAt?: string;

  // Embeddables
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  emergencyContact?: {
    contactName?: string;
    relationship?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
  };
  taxIdPan?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: string[];
  timestamp: string;
}
