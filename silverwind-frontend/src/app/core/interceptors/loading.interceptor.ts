import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Check for custom header to skip loading
  if (req.headers.has('X-Skip-Loading')) {
    const headers = req.headers.delete('X-Skip-Loading');
    return next(req.clone({ headers }));
  }

  // Or check context if preferred, but header is explicit for polling

  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    }),
  );
};
