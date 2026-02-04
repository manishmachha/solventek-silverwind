import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor } from './error.interceptor';
import { ApiErrorResponse } from '../models/api-error-response.model';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let snackBar: { open: any };

  beforeEach(() => {
    snackBar = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should handle ApiErrorResponse and show correct message', () => {
    const errorResponse: ApiErrorResponse = {
      timestamp: '2023-10-27T10:00:00Z',
      status: 400,
      error: 'BAD_REQUEST',
      message: 'Custom backend error message',
      errorCode: 'INVALID_INPUT',
      path: '/api/test',
      method: 'GET',
      traceId: '123',
      requestId: '456',
    };

    httpClient.get('/api/test').subscribe({
      next: () => {
        throw new Error('should have failed with an error');
      },
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(400);
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Custom backend error message',
      'Close',
      expect.any(Object),
    );
  });

  it('should handle standard validation 422 error without explicit body message', () => {
    httpClient.get('/api/test').subscribe({
      next: () => {
        throw new Error('should have failed with an error');
      },
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(422);
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Some error', { status: 422, statusText: 'Unprocessable Entity' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Validation Error. Please check your data.',
      'Close',
      expect.any(Object),
    );
  });

  it('should handle network error', () => {
    const errorEvent = new ErrorEvent('Network error', {
      message: 'Connection failed',
    });

    httpClient.get('/api/test').subscribe({
      next: () => {
        throw new Error('should have failed with an error');
      },
      error: (error: HttpErrorResponse) => {
        expect(error.error).toBe(errorEvent);
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.error(errorEvent);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Network error: Connection failed',
      'Close',
      expect.any(Object),
    );
  });

  it('should handle 500 error without ApiErrorResponse', () => {
    httpClient.get('/api/test').subscribe({
      next: () => {
        throw new Error('should have failed with an error');
      },
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Internal Server Error. Our team has been notified.',
      'Close',
      expect.any(Object),
    );
  });

  it('should handle unknown error status', () => {
    httpClient.get('/api/test').subscribe({
      next: () => {
        throw new Error('should have failed with an error');
      },
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(418);
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('I am a teapot', { status: 418, statusText: 'I am a teapot' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Error 418: I am a teapot',
      'Close',
      expect.any(Object),
    );
  });
});
