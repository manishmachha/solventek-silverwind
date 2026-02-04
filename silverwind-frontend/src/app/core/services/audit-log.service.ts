import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';

export interface AuditLogEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
  actorUserId: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private api = inject(ApiService);

  getAuditLogs(page: number = 0, size: number = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api.get<Page<AuditLogEvent>>('/timeline/audit-logs', params);
  }

  getAuditLogsByEntityType(entityType: string, page: number = 0, size: number = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.api.get<Page<AuditLogEvent>>(`/timeline/audit-logs/entity/${entityType}`, params);
  }

  searchAuditLogs(action: string, page: number = 0, size: number = 20) {
    const params = new HttpParams().set('action', action).set('page', page).set('size', size);
    return this.api.get<Page<AuditLogEvent>>('/timeline/audit-logs/search', params);
  }

  getAuditLogsByDateRange(startDate: string, endDate: string, page: number = 0, size: number = 20) {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('page', page)
      .set('size', size);
    return this.api.get<Page<AuditLogEvent>>('/timeline/audit-logs/date-range', params);
  }
}
