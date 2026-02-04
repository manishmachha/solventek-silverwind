export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
  WEEKEND = 'WEEKEND',
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: string; // ISO Date
  checkInTime?: string; // ISO Time
  checkOutTime?: string; // ISO Time
  status: AttendanceStatus;
  notes?: string;
}

export interface TimesheetEntry {
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  hoursWorked: number;
  notes?: string;
}

export interface TimesheetSummary {
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  daysPresent: number;
  entries: TimesheetEntry[];
}
