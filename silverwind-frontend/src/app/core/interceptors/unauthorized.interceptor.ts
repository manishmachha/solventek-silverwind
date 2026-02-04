import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { DialogService } from '../services/dialog.service';
import { catchError, throwError } from 'rxjs';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const dialogService = inject(DialogService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        console.log(error);

        dialogService.open(
          'Access Denied',
          'You are not authorized to perform this action based on your current role and permissions.',
          'error',
          () => window.history.back(),
        );
      }
      return throwError(() => error);
    }),
  );
};
