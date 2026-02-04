import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface Interview {
  id: string;
  applicationId: string;
  interviewerId: string;
  scheduledAt: string;
  durationMinutes: number;
  type: 'SCREENING' | 'TECHNICAL' | 'HR' | 'CLIENT_ROUND' | 'FINAL';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  meetingLink: string;
  feedback?: string;
  rating?: number;
}

export interface ScheduleInterviewRequest {
  applicationId: string;
  interviewerId: string;
  scheduledAt: string;
  durationMinutes: number;
  type: string;
  meetingLink: string;
}

@Injectable({
  providedIn: 'root',
})
export class InterviewService {
  private api = inject(ApiService);

  scheduleInterview(request: ScheduleInterviewRequest) {
    return this.api.post<Interview>('/interviews/schedule', request);
  }

  getInterviews(applicationId: string) {
    return this.api.get<Interview[]>(`/interviews/application/${applicationId}`);
  }

  submitFeedback(id: string, feedback: string, rating: number, passed: boolean) {
    return this.api.post<Interview>(`/interviews/${id}/feedback`, { feedback, rating, passed });
  }
}
