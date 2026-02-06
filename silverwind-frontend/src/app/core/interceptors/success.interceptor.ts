import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { tap } from 'rxjs';

export const successInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        // Only show snackbar for non-GET methods that modify state
        const isModificationMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

        if (isModificationMethod && event.body && typeof event.body === 'object') {
          const body = event.body as { message?: string; success?: boolean };

          if (body.success && body.message) {
            snackBar.open(body.message, 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar'],
            });
          }
        }
      }
    }),
  );
};
