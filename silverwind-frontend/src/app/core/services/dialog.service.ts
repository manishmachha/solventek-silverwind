import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  isOpen = signal(false);
  title = signal('');
  message = signal('');

  type = signal<'success' | 'warning' | 'error'>('success');

  private onCloseCallback?: () => void;

  open(
    title: string,
    message: string,
    type: 'success' | 'warning' | 'error' = 'success',
    onClose?: () => void,
  ) {
    this.title.set(title);
    this.message.set(message);
    this.type.set(type);
    this.isOpen.set(true);
    this.onCloseCallback = onClose;
  }

  close() {
    this.isOpen.set(false);
    if (this.onCloseCallback) {
      this.onCloseCallback();
      this.onCloseCallback = undefined;
    }
  }

  // Simple confirmation using window.confirm for now to match component usage
  confirm(title: string, message: string): Observable<boolean> {
    const result = window.confirm(`${title}\n\n${message}`);
    return of(result);
  }
}
