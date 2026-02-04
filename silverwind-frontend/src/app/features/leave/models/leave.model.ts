export interface LeaveType {
  id?: string;
  name: string;
  description: string;
  defaultDaysPerYear: number;
  carryForwardAllowed: boolean;
  isActive: boolean;
  accrualFrequency: 'MONTHLY' | 'ANNUALLY' | 'QUARTERLY';
  maxDaysPerMonth?: number;
  maxConsecutiveDays?: number;
  requiresApproval: boolean;
}

export interface LeaveRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveResponse {
  id: string;
  userId: string;
  userName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  approverName?: string;
  createdAt: string;
}

export interface LeaveBalance {
  id: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface LeaveAction {
  leaveRequestId: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}
