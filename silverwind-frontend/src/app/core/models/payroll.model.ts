export interface SalaryStructure {
  id: string;
  userId: string;
  userName: string;
  basic: number;
  da: number;
  hra: number;
  medicalAllowance: number;
  specialAllowance: number;
  lta: number;
  communicationAllowance: number;
  otherEarnings: number;
  epfDeduction: number;
  ctc: number;
}

export interface SalaryRevision {
  id: string;
  userId: string;
  userName: string;
  revisionDate: string;
  oldCtc: number;
  newCtc: number;
  changeReason: string;
}

export interface Payroll {
  id: string;
  userId: string;
  userName: string;
  month: number;
  year: number;
  basic: number;
  da: number;
  hra: number;
  medicalAllowance: number;
  specialAllowance: number;
  lta: number;
  communicationAllowance: number;
  otherEarnings: number;
  epfDeduction: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  paymentDate: string | null;
  status: 'PENDING' | 'PAID';
}

export interface SalaryStructureRequest {
  basic: number;
  da: number;
  hra: number;
  medicalAllowance: number;
  specialAllowance: number;
  lta: number;
  communicationAllowance: number;
  otherEarnings: number;
  epfDeduction: number;
}
