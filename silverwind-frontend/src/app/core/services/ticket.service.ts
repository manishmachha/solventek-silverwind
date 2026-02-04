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
    return this.http.get<Ticket[]>(`${this.apiUrl}/my`);
  }

  getMyTicketsForPolling(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/my`, {
      context: new HttpContext().set(SKIP_LOADER_INTERCEPTOR, true),
    });
  }

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/all`);
  }

  getAllTicketsForPolling(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/all`, {
      context: new HttpContext().set(SKIP_LOADER_INTERCEPTOR, true),
    });
  }

  createTicket(
    subject: string,
    description: string,
    type: TicketType,
    priority: TicketPriority,
    targetOrgId?: string,
    assignedToUserId?: string,
  ): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/create`, {
      subject,
      description,
      type,
      priority,
      targetOrgId,
      assignedToUserId,
    });
  }

  // ... existing methods ...

  getOrganizationUsers(orgId: string): Observable<any[]> {
    return this.http
      .get<any>(`${environment.apiUrl}/organizations/${orgId}/employees`)
      .pipe(map((response: any) => response.data || []));
  }

  updateStatus(id: string, status: TicketStatus): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}/status`, { status });
  }

  getTicketById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  getHistory(id: string): Observable<TicketHistory[]> {
    return this.http.get<TicketHistory[]>(`${this.apiUrl}/${id}/history`);
  }

  getComments(id: string): Observable<TicketComment[]> {
    return this.http.get<TicketComment[]>(`${this.apiUrl}/${id}/comments`);
  }

  addComment(id: string, message: string): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.apiUrl}/${id}/comments`, { message });
  }

  escalateTicket(id: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}/escalate`, {});
  }

  markAsRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/mark-read`, {});
  }

  // Helper for assignment dropdown
  getAllOrganizations(): Observable<OrganizationSummary[]> {
    return this.http.get<any>(`${environment.apiUrl}/organizations`).pipe(
      // API returns ApiResponse<List<Organization>>, we need to map it if structure differs
      // The backend returns Organization entity list wrapped in ApiResponse
      // The frontend uses OrganizationSummary interface
      // We might need to map manual fields or just use what backend sends if matches enough
      // Backend Organization has name, type, id. Summary has name, type, id.
      // So simple mapping of response.data is likely enough.
      // But wait, backend returns FULL Organization. Summary is subset. It's compatible.
      // We need to map from ApiResponse structure.
      // Assuming api response structure is standard { success: boolean, data: ... }
      // TicketService uses HttpClient directly, not ApiService wrapper which might handle unpacking.
      // User Service uses ApiService which handles ApiResponse unpacking.
      // TicketService uses HttpClient.
      // I should switch TicketService to use ApiService or handle unpacking manually.
      // Given existing code uses HttpClient, I'll stick to it but I need to know the response structure.
      // OrganizationService (Backend) returns ApiResponse.
      // So:
      map((response: any) => response.data || []),
    );
  }
}
