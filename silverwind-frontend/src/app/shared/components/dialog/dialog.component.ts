import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="dialogService.isOpen()"
      class="relative z-9999"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <!-- Background backdrop -->
      <div class="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"></div>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        >
          <div
            class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
          >
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10"
                [ngClass]="getIconBgClass()"
              >
                <i class="bi text-lg" [ngClass]="getIconClass()"></i>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                  {{ dialogService.title() }}
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">{{ dialogService.message() }}</p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                (click)="dialogService.close()"
                class="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-colors duration-200"
                [ngClass]="getButtonClass()"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DialogComponent {
  dialogService = inject(DialogService);

  getIconBgClass(): string {
    const type = this.dialogService.type();
    switch (type) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'error':
        return 'bg-red-100';
      default:
        return 'bg-green-100';
    }
  }

  getIconClass(): string {
    const type = this.dialogService.type();
    switch (type) {
      case 'success':
        return 'bi-check-circle text-green-600';
      case 'warning':
        return 'bi-exclamation-triangle text-yellow-600';
      case 'error':
        return 'bi-x-circle text-red-600';
      default:
        return 'bi-check-circle text-green-600';
    }
  }

  getButtonClass(): string {
    const type = this.dialogService.type();
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-500';
      case 'error':
        return 'bg-red-600 hover:bg-red-500';
      default:
        return 'bg-green-600 hover:bg-green-500';
    }
  }
}
