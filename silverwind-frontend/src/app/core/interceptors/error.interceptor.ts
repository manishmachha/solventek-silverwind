import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { ApiErrorResponse } from '../models/api-error-response.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'An unexpected error occurred. Please try again.';
      let action = 'Close';

      // Check if the error response is of type ApiErrorResponse
      const apiError = error.error as ApiErrorResponse;

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        message = `Network error: ${error.error.message}`;
      } else if (apiError && apiError.message) {
        // Backend returned an ApiErrorResponse
        message = apiError?.causes?.[0]?.message
          ? apiError?.causes?.[0]?.message
          : apiError?.message || 'Internal Server Error. Please contact support.';
      } else {
        // Backend returned an unsuccessful response code but not our structured error
        switch (error.status) {
          case 0:
            message = 'Unable to connect to the server. Please check your internet connection.';
            break;
          case 400:
            message = 'Bad Request. Please check your input.';
            break;
          case 401:
            message = 'Session expired. Please login again.';
            // Optionally redirect to login here if not handled by auth guard
            break;
          case 403:
            message = 'Access Denied. You do not have permission.';
            break;
          case 404:
            message = 'The requested resource was not found.';
            break;
          case 409:
            message = 'Conflict. This resource already exists.';
            break;
          case 422:
            message = 'Validation Error. Please check your data.';
            break;
          case 500:
            message = 'Internal Server Error. Our team has been notified.';
            break;
          case 503:
            message = 'Service Unavailable. Please try again later.';
            break;
          default:
            message = `Error ${error.status}: ${error.statusText}`;
        }
      }

      snackBar.open(message, action, {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar'],
      });

      return throwError(() => error);
    }),
  );
};
