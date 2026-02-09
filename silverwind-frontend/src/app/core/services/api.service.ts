import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; // Ensure environment.ts is created

  private formatErrors(error: HttpErrorResponse) {
    // Logic to handle errors or rethrow
    return throwError(() => error);
  }

  get<T>(
    path: string,
    params: HttpParams = new HttpParams(),
    headers?: HttpHeaders,
  ): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}${path}`, { params, headers }).pipe(
      map((response: ApiResponse<T>) => response.data),
      catchError(this.formatErrors),
    );
  }

  put<T>(path: string, body: Object = {}, headers?: HttpHeaders): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}${path}`, body, { headers }).pipe(
      map((response: ApiResponse<T>) => response.data),
      catchError(this.formatErrors),
    );
  }

  post<T>(path: string, body: Object = {}, headers?: HttpHeaders): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${path}`, body, { headers }).pipe(
      map((response: ApiResponse<T>) => response.data),
      catchError(this.formatErrors),
    );
  }

  patch<T>(path: string, body: Object = {}, headers?: HttpHeaders): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.apiUrl}${path}`, body, { headers }).pipe(
      map((response: ApiResponse<T>) => response.data),
      catchError(this.formatErrors),
    );
  }

  delete<T>(path: string, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}${path}`, { headers }).pipe(
      map((response: ApiResponse<T>) => response.data),
      catchError(this.formatErrors),
    );
  }

  download(path: string): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}${path}`, { responseType: 'blob' })
      .pipe(catchError(this.formatErrors));
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
