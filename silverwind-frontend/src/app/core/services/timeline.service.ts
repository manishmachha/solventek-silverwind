import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Page } from '../models/page.model';
import { HttpParams } from '@angular/common/http';

export interface TimelineEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  metadata?: string;
  actorId: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  private api = inject(ApiService);

  getTimeline(entityType: string, entityId: string, page: number = 0, size: number = 20) {
    let params = new HttpParams().set('page', page).set('size', size);
    return this.api.get<Page<TimelineEvent>>(`/timeline/${entityType}/${entityId}`, params);
  }
}
