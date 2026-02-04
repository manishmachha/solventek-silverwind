export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'PENDING_VENDOR'
  | 'PENDING_CLIENT'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketType =
  | 'ONBOARDING'
  | 'PAYROLL'
  | 'TIMESHEET'
  | 'CONTRACT'
  | 'VISA'
  | 'C2H_CONVERSION'
  | 'CLIENT_ISSUE'
  | 'VENDOR_ISSUE'
  | 'ASSET'
  | 'LEAVE'
  | 'DOCUMENT'
  | 'FEEDBACK'
  | 'COMPLAINT'
  | 'OTHER';

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  employee: UserSummary;
  assignedTo?: UserSummary;
  isEscalated: boolean;
  unreadCountForEmployee: number;
  unreadCountForAdmin: number;
  createdAt: string;
  updatedAt: string;
  targetOrganization?: OrganizationSummary;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  type: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  message: string;
  sender: UserSummary;
  sentAt: string;
}

export interface TicketHistory {
  id: string;
  oldStatus: TicketStatus;
  newStatus: TicketStatus;
  changedBy: UserSummary;
  changedAt: string;
}
