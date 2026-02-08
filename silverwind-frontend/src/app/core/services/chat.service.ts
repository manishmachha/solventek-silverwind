import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatResponse {
  response: string;
  timestamp: string;
  success: boolean;
}

/**
 * Service for communicating with the AI chatbot backend.
 * Works identically in local-dev and prod environments.
 */
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/chat`;

  /**
   * Send a message to the AI chatbot.
   * @param message The user's message
   * @param intent Optional explicit intent: 'POLICY' or 'ACTION'
   */
  sendMessage(message: string, intent?: string): Observable<{ data: { response: string } }> {
    const payload: { message: string; intent?: string } = { message };
    if (intent) {
      payload.intent = intent;
    }
    return this.http.post<{ data: { response: string } }>(this.apiUrl, payload).pipe(
      catchError((error) => {
        console.error('Chat API error:', error);
        return of({ data: { response: 'Sorry, I encountered an error. Please try again.' } });
      }),
    );
  }

  /**
   * Send a message and stream the response.
   */
  sendMessageStream(message: string, intent?: string): Observable<string> {
    const payload: { message: string; intent?: string } = { message };
    if (intent) {
      payload.intent = intent;
    }

    return new Observable<string>((observer) => {
      const controller = new AbortController();

      // Get token manually since fetch bypasses HTTP interceptors
      const token = sessionStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            // Handle auth errors explicitly
            if (response.status === 401 || response.status === 403) {
              throw new Error('Unauthorized or Forbidden');
            }
            throw new Error('Network response was not ok');
          }
          if (!response.body) {
            throw new Error('Response body is null');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Split by newline to handle lines immediately
            const lines = buffer.split('\n');
            // Keep the last line in buffer as it might be incomplete
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data:')) {
                // data: <content>
                let content = line.substring(5);
                if (content.startsWith(' ')) {
                  content = content.substring(1);
                }
                observer.next(content);
              }
            }
          }

          // Process any remaining buffer content
          if (buffer && buffer.startsWith('data:')) {
            let content = buffer.substring(5);
            if (content.startsWith(' ')) {
              content = content.substring(1);
            }
            observer.next(content);
          }

          observer.complete();
        })
        .catch((err) => {
          console.error('Stream error:', err);
          observer.error(err);
        });

      return () => controller.abort();
    });
  }

  /**
   * Clear conversation history on the backend.
   */
  clearHistory(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/history`);
  }
}
