import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" [title]="title" (isOpenChange)="onCancel()">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <div
            class="shrink-0 flex items-center justify-center h-12 w-12 rounded-full"
            [ngClass]="{
              'bg-red-100': type === 'danger',
              'bg-indigo-100': type === 'primary',
              'bg-amber-100': type === 'warning',
            }"
          >
            <i
              class="bi text-xl"
              [ngClass]="{
                'bi-exclamation-triangle text-red-600': type === 'danger',
                'bi-info-circle text-indigo-600': type === 'primary',
                'bi-exclamation-circle text-amber-600': type === 'warning',
              }"
            ></i>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
            <p class="text-sm text-gray-500 mb-6">{{ message }}</p>
            <div class="flex justify-end gap-3">
              <button
                (click)="onCancel()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {{ cancelText }}
              </button>
              <button
                (click)="onConfirm()"
                class="px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm"
                [ngClass]="{
                  'bg-red-600 hover:bg-red-700 focus:ring-red-500': type === 'danger',
                  'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500': type === 'primary',
                  'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500': type === 'warning',
                }"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </app-modal>
  `,
  styles: [
    `
      /* Hide default modal header as we have a custom layout */
      ::ng-deep app-confirm-modal app-modal .border-b {
        display: none !important;
      }
    `,
  ],
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() type: 'danger' | 'primary' | 'warning' = 'primary';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
