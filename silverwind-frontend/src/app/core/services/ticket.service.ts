import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketType,
  TicketComment,
  TicketHistory,
  OrganizationSummary,
} from '../models/ticket.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export const SKIP_LOADER_INTERCEPTOR = new HttpContextToken<boolean>(() => false);

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);
  // Using relative path via proxy or absolute from environment.
  // Assuming environment.apiUrl exists, typically '/api' or similar.
  // Based on other services:
  private apiUrl = `${environment.apiUrl}/tickets`;

  getMyTickets(): Observable<Ticket[]> {
    return this.http
      .get<ApiResponse<Ticket[]>>(`${this.apiUrl}/my`)
      .pipe(map((response) => response.data));
  }

  getMyTicketsForPolling(): Observable<Ticket[]> {
    return this.http
      .get<ApiResponse<Ticket[]>>(`${this.apiUrl}/my`, {
        context: new HttpContext().set(SKIP_LOADER_INTERCEPTOR, true),
      })
      .pipe(map((response) => response.data));
  }

  getAllTickets(): Observable<Ticket[]> {
    return this.http
      .get<ApiResponse<Ticket[]>>(`${this.apiUrl}/all`)
      .pipe(map((response) => response.data));
  }

  getAllTicketsForPolling(): Observable<Ticket[]> {
    return this.http
      .get<ApiResponse<Ticket[]>>(`${this.apiUrl}/all`, {
        context: new HttpContext().set(SKIP_LOADER_INTERCEPTOR, true),
      })
      .pipe(map((response) => response.data));
  }

  createTicket(
    subject: string,
    description: string,
    type: TicketType,
    priority: TicketPriority,
    targetOrgId?: string,
    assignedToUserId?: string,
  ): Observable<Ticket> {
    return this.http
      .post<ApiResponse<Ticket>>(`${this.apiUrl}/create`, {
        subject,
        description,
        type,
        priority,
        targetOrgId,
        assignedToUserId,
      })
      .pipe(map((response) => response.data));
  }

  // ... existing methods ...

  getOrganizationUsers(orgId: string): Observable<any[]> {
    return this.http
      .get<ApiResponse<any>>(`${environment.apiUrl}/organizations/${orgId}/employees`)
      .pipe(map((response: ApiResponse<any>) => response.data || []));
  }

  updateStatus(id: string, status: TicketStatus): Observable<Ticket> {
    return this.http
      .patch<ApiResponse<Ticket>>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(map((response) => response.data));
  }

  getTicketById(id: string): Observable<Ticket> {
    return this.http
      .get<ApiResponse<Ticket>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  getHistory(id: string): Observable<TicketHistory[]> {
    return this.http
      .get<ApiResponse<TicketHistory[]>>(`${this.apiUrl}/${id}/history`)
      .pipe(map((response) => response.data));
  }

  getComments(id: string): Observable<TicketComment[]> {
    return this.http
      .get<ApiResponse<TicketComment[]>>(`${this.apiUrl}/${id}/comments`)
      .pipe(map((response) => response.data));
  }

  addComment(id: string, message: string): Observable<TicketComment> {
    return this.http
      .post<ApiResponse<TicketComment>>(`${this.apiUrl}/${id}/comments`, { message })
      .pipe(map((response) => response.data));
  }

  escalateTicket(id: string): Observable<Ticket> {
    return this.http
      .patch<ApiResponse<Ticket>>(`${this.apiUrl}/${id}/escalate`, {})
      .pipe(map((response) => response.data));
  }

  markAsRead(id: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/${id}/mark-read`, {})
      .pipe(map(() => void 0));
  }

  // Helper for assignment dropdown
  getAllOrganizations(): Observable<OrganizationSummary[]> {
    return this.http
      .get<ApiResponse<any>>(`${environment.apiUrl}/organizations`)
      .pipe(map((response: ApiResponse<any>) => response.data || []));
  }
}
