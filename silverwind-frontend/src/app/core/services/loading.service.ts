import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private activeRequests = signal(0);

  // Expose loading state as a signal
  readonly isLoading = computed(() => this.activeRequests() > 0);

  show() {
    this.activeRequests.update((count) => count + 1);
  }

  hide() {
    this.activeRequests.update((count) => Math.max(0, count - 1));
  }
}
